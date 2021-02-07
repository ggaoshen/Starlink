import React, {Component} from 'react';
import { feature } from 'topojson-client';
import axios from 'axios';
import { geoKavrayskiy7 } from 'd3-geo-projection';
import { geoGraticule, geoPath } from 'd3-geo';
import { select as d3Select } from 'd3-selection'; // d3Select is alias
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";


import {SATELLITE_POSITION_URL, WORLD_MAP_URL, SAT_API_KEY} from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor(){
        super();
        this.state = {
            isLoading: false,
            isDrawing: false
        }
        this.map = null
        this.refMap = React.createRef(); // 这个才可以reference到render return内的map-box
        this.refTrack = React.createRef();
        this.color = d3Scale.scaleOrdinal(schemeCategory10); // 设定color spectrum，可以对应数字到颜色
    }


    render() {
        return (
            <div className="map-box">
                <canvas
                    className="map"
                    ref={this.refMap} />

                <canvas
                    className="track"
                    ref={this.refTrack} />

                <div className="hint" />

            </div>
        );
    }

    componentDidMount() {
        axios.get(WORLD_MAP_URL)
            .then(res => {
                const { data } = res;
                const land = feature(data, data.objects.countries).features;
                this.generateMap(land);
            })
            .catch(e => console.log('err in fecth world map data ', e))
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // world map finished mounting, updated props will trigger updating
        // plot satellite here
        if (prevProps.satData !== this.props.satData) { // check if props changed
            // step1: get setting and select satlist
            const {
                latitude,
                longitude,
                elevation,
                altitude,
                duration,
            } = this.props.observerData;

            const endTime = duration * 60; // set end time to be 60x duration

            // step2: prepare for url
            const urls = this.props.satData.map( sat => {
                const {satid} = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;
                //get satellite positions from api n2yo.com/api/#positions
                // Request: /positions/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{seconds}
                return axios.get(url);
            });

            // step3: track trajectory
            Promise.all(urls)
                .then( results => {
                    console.log(results);
                    const arr = results.map( res => res.data );
                    this.setState({
                        isLoading: false,
                        isDrawing: true
                    });


                    // step4: track
                    if (!prevState.isDrawing) {
                        this.track(arr);
                    } else {
                        const oHint = document.getElementsByClassName("hint")[0];
                        oHint.innerHTML =
                            "Please wait for these satellite animation to finish before selection new ones!";
                    }
                })
                .catch(e => {
                    console.log("err in fetch satellite position -> ", e.message);
                });

        }

    }

    generateMap(land){
        // create projection - map shape
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);

        // find dom - map position
        const graticule = geoGraticule();
        // refMap get dom element must use .current
        const canvas = d3Select(this.refMap.current)
            .attr("width", width)
            .attr("height", height);

        const canvas2 = d3Select(this.refTrack.current)
            .attr("width", width)
            .attr("height", height);

        let context = canvas.node().getContext("2d");
        let context2 = canvas2.node().getContext("2d");

        let path = geoPath()
            .projection(projection)
            .context(context);

        land.forEach(ele => {
            context.fillStyle = '#B3DDEF';
            context.strokeStyle = '#000';
            context.globalAlpha = 0.7;
            context.beginPath();
            path(ele);
            context.fill();
            context.stroke();

            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;
            path(graticule.outline());
            context.stroke();
        })

        this.map = {
            projection: projection,
            graticule: graticule,
            context: context,
            context2: context2

        }
    }

    track = data => {
        if(!data[0].hasOwnProperty('positions')) {
            throw new Error('no position data');
            return;
        }

        // step1: total number of position
        const len = data[0].positions.length;
        // step2: duration
        const { duration } = this.props.observerData;
        // step3:
        const { context2 } = this.map;

        let now = new Date();
        let i = 0;

        let timer = setInterval( () => {
            let ct = new Date();

            let timePassed = i === 0 ? 0 : ct - now;
            let time = new Date(now.getTime() + 60 *timePassed)

            // drawing track
            context2.clearRect(0, 0, width, height);

            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 10); // map top timestamp

            // handle when it reaches the end of positions
            if (i >= len) {
                clearInterval(timer);
                this.setState({ isDrawing: false });
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML = "";
                return;
            }

            data.forEach(sat => {
                const { info, positions } = sat;
                this.drawSat(info, positions[i]);
            });

            i += 60;

        }, 1000)

    }

    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos;

        if (!satlongitude || !satlatitude) return;

        const { satname } = sat;
        const nameWithNumber = satname.match(/\d+/g).join(""); // regex get numbers from sat name

        const { projection, context2 } = this.map; // context2 is canvas for plotting path
        const xy = projection([satlongitude, satlatitude]);

        context2.fillStyle = this.color(nameWithNumber); // color is set by sat name's numerical portion
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();

        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
    };


}

export default WorldMap;

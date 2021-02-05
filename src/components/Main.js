import React, {Component} from 'react';
import axios from 'axios';
import SatSetting from "./SatSetting";
import SatelliteList from './SatelliteList';
import WorldMap from './WorldMap';
import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";

class Main extends Component {
    state = {
        setting: null,
        satInfo: null,
        isLoadingList: false,
    }
    render() {
        const { satInfo, isLoadingList } = this.state;
        return (
            <div className="main">
                <div className="left-side">
                    <SatSetting onShow={this.fetchSatellite}/>
                    <SatelliteList
                        isLoad={isLoadingList}
                        satInfo={satInfo}
                    />
                </div>
                <div className="right-side">
                    <WorldMap />
                </div>
            </div>
        );
    }

    // 子到父传数据
    // Step 1：define cb function
    fetchSatellite = setting => {
        console.log(setting);
        // fetch datat from the server

        // step 1: get setting
        const { latitude, longitude, elevation, altitude} = setting;

        // step 2: config
        // check n2yo.com/api/#positions for request url format
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`

        // step 3: send req
        //  - show spin and send req
        this.setState( {isLoadingList: true} )
        axios.get(url).then( // axios用来发送请求
            response => {
                console.log(response.data)
                // when fetching data successful, hide spin and update satInfo
                this.setState({
                    satInfo: response.data,
                    isLoadingList: false
                })
            }).catch(error => {
                console.log('err in fetch satellite -> ', error)
                // when fetching data failed, hide spin
                this.setState( {isLoadingList: false} )
        })
    }

    showMap = () => {
        console.log('show on the map');
    }

}

export default Main;
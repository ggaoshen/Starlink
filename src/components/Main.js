import React, {Component} from 'react';
import axios from 'axios';
import SatSetting from "./SatSetting";
import SatelliteList from './SatelliteList';
import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";


class Main extends Component {
    render() {
        return (
            <div className="main">
                <div className="left-side">
                    <SatSetting onShow={this.fetchSatellite}/>
                    <SatelliteList />
                </div>
                <div className="right-side">
                    right
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
        axios.get(url).then(
            response => {
                console.log(response.data)
                this.setState({
                    satInfo: response.data,
                    isLoadingList: false
                })
            }).catch(error => {
                console.log('err in fetch satellite -> ', error)
        })
    }
}

export default Main;
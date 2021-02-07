

import React, {Component} from 'react';
import { Button, Spin, List, Avatar, Checkbox } from 'antd';
import satelliteIcon from "../assets/images/satellite.svg";

class SatelliteList extends Component {
    constructor(){
        super();
        this.state = {
            selected: [],
            isLoad: false
        };
    }

    render() {
        const { isLoad } = this.props;
        const { selected } = this.state;
        const satList = this.props.satInfo ? this.props.satInfo.above : [];
        // List的dataSource必须要list，如果satInfo为空，则返回undefined，需要特殊处理
        return (
            <div className="sat-list-box">
                {/*<div style={{textAlign: "center"}}>*/}
                <Button className="sat-list-btn"
                        size="large"
                        disabled={ selected.length === 0}
                        onClick={this.onShowSatMap}
                >Track on the map</Button>
                <hr/>
                {
                    isLoad
                        ?
                        <div className="spin-box">
                                <Spin size="large" tip="Loading..." />
                        </div>
                        :
                        <List
                            className='sat-list'
                            itemLayout="horizontal"
                            dataSource={ satList } // 传入的是一个satellite list，下面return里item就是每个list的element
                            renderItem={ item => {
                            console.log(item)
                            return (
                                <List.Item
                                    // actions必须接list,所以需要[]
                                    actions={[
                                    <Checkbox dataInfo={item}
                                              onChange={this.onChange}
                                    />]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={satelliteIcon} size="50"/>}
                                        title={<p>{item.satname}</p>}
                                        description={`Launch Date:${item.launchDate}`}
                                    />
                                </List.Item>
                            )}
                            }
                        />
                }
            </div>
        );
    }

    onChange = e => {
        // console.log("click ->", e.target)
        const {checked, dataInfo} = e.target;
        // processing the statellite
        const {selected} = this.state;
        // add or remove seleted satellite to/from the satList
        const list  = this.addOrRemove(dataInfo, checked, selected);
        this.setState({ selected: list});
    }

    addOrRemove = (sat, status, list) => {
        // case1: check is true
        // -> sat not in list -> add it
        // -> sat in list -> do nothing

        // case2: check is false
        // -> sat in list -> remove
        // -> sat not in list -> nothing

        const found = list.some( item => item.satid === sat.satid ); // 在list里找sat.id是否存在
        if(status && !found) {
            list = [...list, sat] // 在list基础上添加sat
        }

        // 顺口溜： 删除filter, 访问用map, 增加 ...
        if(!status && found) {
            list = list.filter( item => item.satid !== sat.satid );
        }
        console.log(list)
        return list;
    }

    onShowSatMap = () =>{
        this.props.onShowMap(this.state.selected);
    }

}

export default SatelliteList;

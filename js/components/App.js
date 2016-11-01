import React from "react";
import ReactDOM from "react-dom";

import Header from './Header'
import Controls from './Controls'
import DataView from './DataView'
import Footer from './Footer'
import LocalStorageIO from './LocalStorageIO'

import $ from 'jquery'
import _ from 'lodash'

var local_storage_version = "1.0.3"

const localStorageIO = new LocalStorageIO(local_storage_version)
//localStorageIO.clearLocalStorage()

export default class App extends React.Component {

	constructor(props) {
		super(props)

		var state = this.getPersistentState()
		var filters = {}
		var listings = localStorageIO.readPropertiesFromLocalStorage(state.position, state.zoom, filters) 
		state.listings = listings
		this.state = state

		this.tick = this.tick.bind(this)
		this.curlRequest = this.curlRequest.bind(this)
		this.addNewProperties = this.addNewProperties.bind(this)
		this.updateSearchCriteria = this.updateSearchCriteria.bind(this)
		this.setPositionScale = this.setPositionScale.bind(this)
		this.savePersistentState = this.savePersistentState.bind(this)
		this.has_moved = this.has_moved.bind(this)
		console.log("---")
		console.log(this.state)
	}

	componentDidMount() {
		this.timer = setInterval(this.tick, 1000)
	}

	componentWillUnmount() {
		clearInterval(this.time)
	}

	getPersistentState() {
		var position = {latitude: 40.7, longitude: -100.95}
		var zoom = 7
		var searchCriteria = {
			price: [0, 1000000],
			bedrooms: [0, 8],
			bathrooms: [0, 7],
			sqft: [100, 4000],
		}
		var state = {
			network_ok: true,
			waiting: false,
			count: 1,
			limit: 500,
			offset: 0,
			numCalls: 0,
			changed: false,
			busy: false,
			searchCriteria: searchCriteria,
			position: position,
			zoom: zoom
		}
		var saved = localStorageIO.getPersistentState()
		if (saved != undefined) {
			var keys = Object.keys(saved)
			for (var i=0; i < keys.length; i++) {
				var key = keys[i]
				var val = saved[key]
				state[key] = val
			}
		}
		console.log("state")
		console.log(state)
		return state
	}

	savePersistentState() {
		console.log(["save", this.state])
		localStorageIO.savePersistentState(this.state)
	}

	/*
		This function is called by `Controls` which sends updates
		only when the user has finished changing a slider component
	*/
	updateSearchCriteria(ncriteria) {
		var uSearchCriteria = _.extend({}, this.state.searchCriteria);
		var keys = Object.keys(ncriteria)
		for (var i=0; i < keys.length; i++) {
			var key = keys[i]
			var range = ncriteria[key]
			uSearchCriteria[key] = range
		}
		var nstate = {searchCriteria: uSearchCriteria, offset: 0, count: 1}
		this.setState(nstate)
		var matches = localStorageIO.readPropertiesFromLocalStorage(this.position, this.scale, filters) 
		// TODO: update from cache
		// TODO: update ajax
		this.savePersistentState()
	}

	addNewProperties(resp) {
		var listings = resp["results"]
		var count = resp['count']
		var offset = this.state.offset + resp['results'].length
		if (true) { // This line tells it to give up after 1 call, good for development
			offset = count
		}
		var filters = {}
		localStorageIO.writeLocalStorage(resp)
		var listings = localStorageIO.readPropertiesFromLocalStorage(this.state.position, this.state.scale, filters) 
		var s3 = new Date().getTime()
		this.setState({count, offset, listings})
		var s4 = new Date().getTime()
		console.log(['slow run:', s4-s3])
		// TODO: do eviction
		// TODO: Do filtering
	  	/*
	    var bounds = map.getExtent().clone()
	    bbox = bounds.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"))
	    this.filters = get_request()
	    results = readPropertiesFromLocalStorage(bbox, this.filters)
	    */
	}

	setPositionScale(position, scale) {
		var prev = {position: this.state.position, scale: this.state.scale}
		var now = {position: position, scale: scale}
		if (this.has_moved(prev, now)) {
			console.log("moved")
			this.setState({position, scale, offset: 0, count: 1})
			this.savePersistentState()
			console.log([prev, now])
			console.log("persist")
			console.log(now)
		} else {
			console.log("not moved")
		}
	}

	curlRequest() {
		var position = this.state.position
		var searchCriteria = this.state.searchCriteria
		var minprice = searchCriteria.price[0]
		var maxprice = searchCriteria.price[1]
		var minbed = searchCriteria.bedrooms[0]
		var maxbed = searchCriteria.bedrooms[1]
		var minbath = searchCriteria.bathrooms[0]
		var maxbath = searchCriteria.bathrooms[1]
		var minsqft = searchCriteria.sqft[0]
		var maxsqft = searchCriteria.sqft[1]
		var curl = `http://api.openhouseproject.co/api/property/?min_price=${minprice}&max_price=${maxprice}&min_bedrooms=${minbed}&max_bedrooms=${maxbed}&min_bathrooms=${minbath}&max_bathrooms=${maxbath}&min_building_size=${minsqft}&max_building_size=${maxsqft}`
		var lat = position.latitude
		var lng = position.longitude
		// TODO: revisit this radius
		var rad = 10
		curl = curl + "&close_to=(" + rad + "," + lat + "," + lng + ")"
		return curl
	}
	tick() {
		if (!this.state.busy) {
			var offset = this.state.offset
			var limit = this.state.limit
			var count = this.state.count
			if (offset < count) {
				console.log("go")
				this.setState({busy: true})
				var curl = this.curlRequest()
				var url = curl + `&limit=${limit}&offset=${offset}`
				var me = this
				var prev = {position: this.state.position, scale: this.state.scale}
				console.log(url)
				$.ajax({
				  url: url,
				  type: 'GET',
				  contentType: 'text/json',
				  dataType: 'json',
				  success: function (resp) {
				  	console.log("success")
					me.addNewProperties(resp)
				  	var now = {position: me.state.position, scale: me.state.scale}
				  	if (me.has_moved(prev, now)) {
					  	me.setState({busy: false, offset: 0, count: 1})
					} else {
					  	me.setState({busy: false})
				  	}
				  },
				  error: function (xhr, ajaxOptions, thrownError) {
				  	console.log("fail")
				  	console.log(me)
				  	me.setState({network_ok: false, busy: false})
				  }
				})
			} else {
				console.log("skip")
			}
		}
	}

	has_moved(prev, now) {
		var pos1 = prev.position
		var pos2 = now.position
		var scale1 = prev.scale1
		var scale2 = now.scale2
		var delta = 0.000001
		if (Math.abs(pos1.latitude - pos2.latitude) > delta) {
			return true
		}
		if (Math.abs(pos1.longitude - pos2.longitude) > delta) {
			return true
		}
		if (scale1 != scale2) {
			return true
		}
		return false
	}

	render() {
		var curlRequestFn = this.curlRequest
	    return (<div>
	    		  <Header />
	    		  <Controls curlRequestFn={curlRequestFn} count={this.state.count} offset={this.state.offset} busy={this.state.busy} changed={this.state.changed} network_ok={this.state.network_ok} searchCriteria={this.state.searchCriteria} updateSearchCriteria={this.updateSearchCriteria.bind(this)} />
	    		  <DataView position={this.state.position} zoom={this.state.zoom} setPositionScale={this.setPositionScale} listings={this.state.listings} />
	    		  <Footer />
	           </div>)
	}
}

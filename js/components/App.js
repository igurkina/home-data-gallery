import React from "react";
import ReactDOM from "react-dom";

import Header from './Header'
import Controls from './Controls'
import DataView from './DataView'
import Footer from './Footer'
import LocalStorageIO from './LocalStorageIO'

import $ from 'jquery'
import _ from 'lodash'

const localStorageIO = new LocalStorageIO()
//localStorageIO.clearLocalStorage()

export default class App extends React.Component {

	constructor(props) {
		super(props)

		var viewport = {
			top: 57.66,
			left: -136.85,
			bottom: 14.01,
			right: 14.01
		}
		var filters = {}
		var listings = localStorageIO.readPropertiesFromLocalStorage(viewport, filters) 

		var searchCriteria = {
			price: [0, 1000000],
			bedrooms: [0, 8],
			bathrooms: [0, 7],
			sqft: [100, 4000],
		}
		this.state = {
			listings: listings,
			waiting: false,
			count: 1,
			limit: 5,
			offset: 0,
			numCalls: 0,
			changed: false,
			busy: false,
			searchCriteria: searchCriteria
		}

		this.tick = this.tick.bind(this)
		this.curlRequest = this.curlRequest.bind(this)
		this.addNewProperties = this.addNewProperties.bind(this)
		this.updateSearchCriteria = this.updateSearchCriteria.bind(this)
	}
	componentDidMount() {
		this.timer = setInterval(this.tick, 1000)
	}

	componentWillUnmount() {
		clearInterval(this.time)
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
		var matches = localStorageIO.readPropertiesFromLocalStorage(viewport, filters) 
		// TODO: update from cache
		// TODO: update ajax
	}
	addNewProperties(resp) {
		var listings = resp["results"]
		var count = resp['count']
		var offset = resp['results'].length
		// TODO: Better forward crawling management
		var busy = true
		if (true) { // This line tells it to give up after 1 call, good for development
			offset = count
			busy = false
		}
		this.setState({count, offset, busy, listings})
		// TODO: do eviction
		// TODO: Do filtering
		localStorageIO.writeLocalStorage(resp)
	  	/*
	    var bounds = map.getExtent().clone()
	    bbox = bounds.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"))
	    this.filters = get_request()
	    results = readPropertiesFromLocalStorage(bbox, this.filters)
	    */
	}
	curlRequest() {
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
		return curl
	}
	tick() {
		if (!this.state.busy) {
			var offset = this.state.offset
			var limit = this.state.limit
			var count = this.state.count
			if (offset < count) {
				var curl = this.curlRequest()
				var url = curl + `&limit=${limit}&offset=${offset}`
				var me = this
				$.ajax({
				  url: url,
				  type: 'GET',
				  contentType: 'text/json',
				  dataType: 'json',
				  success: this.addNewProperties,
				  error: function (xhr, ajaxOptions, thrownError) {
				    console.log(thrownError)
				    //api.busy = false
				  }
				})
			}
		}
	}

	render() {
		var curlRequestFn = this.curlRequest
	    return (<div>
	    		  <Header />
	    		  <Controls curlRequestFn={curlRequestFn} count={this.state.count} offset={this.state.offset} busy={this.state.busy} changed={this.state.changed} searchCriteria={this.state.searchCriteria} updateSearchCriteria={this.updateSearchCriteria.bind(this)} />
	    		  <DataView listings={this.state.listings} />
	    		  <Footer />
	           </div>)
	}
}
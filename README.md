[![Stories in Ready](https://badge.waffle.io/data-skeptic/home-data-gallery.png?label=ready&title=Ready)](https://waffle.io/data-skeptic/home-data-gallery)

# OpenHouse Interactive Tool
This repo is a Node.js webapp with React.js.  It retrieves data via the OpenHouse API and allows visitors to interact with and visualize the data made available by the OpenHouse Project.  Visitors to this tool can see properties on a map, datatable, or visualizations.

## Examples found in code:
* Mapping with OSM
* Using the data api
* Statitics
* Pulling in other data sources
* Other

## How to get involed:
* [Join the team](https://dataskeptic.slack.com).
* Check out our [Waffle page](https://waffle.io/data-skeptic/home-data-gallery) of open tasks.
* Fix a bug or implement a features, and then make a pull request.
* If all else fails, reach out to kyle@dataskeptic.com for help getting involved.

## Steps to contribute to this codebase:
1. Create a feature branch
2. Make your changes and push
3. Submit a pull request from your feature branch to dev
4. Remind us on slack that you did a PR
5. Wait for the PR to be reviewed/merged
6. Check the URL above to see your changes live
7. All things going well, we’ll then merge to master which will deploy to `gallery.openhouseproject.co` (that step not fully implemented yet)


## Running in Dev
1. `npm install`
1. In one terminal tab `npm run watch` alias for `webpack --watch`
1. In another terminal tab `npm start` alias for `http-server` which will start a dev http server from the root of the project
1. Open `http://127.0.0.1:8080/react.htm`

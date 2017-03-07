define(["dojo/_base/declare",
        "dijit/_WidgetBase",
        "dojo/_base/lang",
        "dojo/topic",
        "dojo/html",
        "dojo/dom-style",
        "dojo/dom-attr",
        "dojo/request",
        "dojo/request/script",
        "dojo/fx",
        "esri/geometry/SpatialReference",
        "esri/geometry/geometryEngineAsync",
        "esri/geometry/geometryEngine",
        "esri/tasks/Locator",
        "esri/geometry/Extent",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/geometry/Polyline",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/PointSymbol3D",
        "esri/symbols/ObjectSymbol3DLayer",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/TextSymbol3DLayer",
        "esri/layers/ElevationLayer",
        "esri/layers/SceneLayer",
        "esri/layers/TileLayer",
        "esri/layers/FeatureLayer",
        "esri/Camera",
        "esri/Viewpoint",
        "esri/widgets/Locate",
        "esri/tasks/Geoprocessor",
        "esri/tasks/support/FeatureSet",
        "esri/tasks/support/LinearUnit",
        "esri/tasks/ServiceAreaTask", 
        "esri/tasks/support/ServiceAreaParameters",
        "esri/tasks/RouteTask",
        "esri/tasks/support/RouteParameters",
        "esri/geometry/support/webMercatorUtils"
        ],
    function(declare,
            _WidgetBase,
    		lang,
            topic,
            html,
            domStyle,
            domAttr,
            request,
            script,
            fx,
            SpatialReference,
            geometryEngineAsync,
            geometryEngine,
            Locator,
    		Extent,
            GraphicsLayer,
            Graphic,
            Point,
            Polyline,
            SimpleRenderer,
            PointSymbol3D,
            ObjectSymbol3DLayer,
            SimpleFillSymbol,
            SimpleMarkerSymbol,
            SimpleLineSymbol,
            TextSymbol3DLayer,
            ElevationLayer,
            SceneLayer,
            TileLayer,
            FeatureLayer,
            Camera,
            Viewpoint,
            Locate,
            Geoprocessor,
            FeatureSet,
            LinearUnit,
            ServiceAreaTask,
            ServiceAreaParameters,
            RouteTask,
            RouteParameters,
            webMercatorUtils
    		) {
        return declare("MapFunctions", [_WidgetBase], {
            /**
             * function called by aws-mapper-iot.js when something is published to map_topic topic at AWS IoT. 
             * aws-iot-sdk-browser-bundle.js was bundled using browserify 
             * README to browserify it here https://github.com/aws/aws-iot-device-sdk-js/blob/master/README.md#browser
             *  
             * params: jsonPayload - Object from Alexa that has the function name and values to pass to mapFunctions widget
             */
            callMapFunction: function(jsonPayload) {
                // optional parameter to not stop any animation when perfomring the map action
                if (jsonPayload.dontStopAnimation === undefined && jsonPayload.function != 'stopAnimation') {
                    this.stopAnimation(null, true);
                }
                
                // call the passed function
                var func = lang.hitch(this, jsonPayload.function, jsonPayload.values);
                func();
            },
            startup: function() {
                this.inherited(arguments);

                // view environment settings. lighting will turn on but it does not seem to turn off in code.
                //view.environment.lighting.date = Date.now();
                //view.environment.lighting.directShadowsEnabled = true;
                this.view.environment.atmosphereEnabled = true;
                this.view.environment.atmosphere.quality = "high";

                // layers
                // badass
                var deathStarLayer = new TileLayer({
                  url: "https://tiles.arcgis.com/tiles/S8Rk6283acnVJZJp/arcgis/rest/services/death_star/MapServer",
                  id: "death-star",
                  opacity: 1,
                  visible: false
                });
                this.view.map.add(deathStarLayer);

                // hurricane
                var hurricaneLyr = new FeatureLayer({
                  url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Hurricanes/MapServer/0",
                  id: "hurricane",
                  visible: false
                });
                this.view.map.add(hurricaneLyr);

                // nyc
                // var nycSceneLayer = new SceneLayer({
                //   url: "https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/NYCatt/SceneServer"
                // });
                // this.view.map.add(nycSceneLayer);

                // san diego
                // var sdSceneLayer = new SceneLayer({
                //   portalItem: {
                //     id: "fad90a1b2f5243f99c2d49aa6719bfd7"
                //   },
                //   popupEnabled: false
                // });
                // this.view.map.add(sdSceneLayer);

                // graphics layer for all points
                this.pointGraphicsLayer = new GraphicsLayer();
                this.view.map.add(this.pointGraphicsLayer);

                // graphics layer for all polylines and polygons
                this.polygonGraphicsLayer = new GraphicsLayer();
                this.view.map.add(this.polygonGraphicsLayer);

                // graphics layer for all text
                this.textGraphicsLayer = new GraphicsLayer();
                this.view.map.add(this.textGraphicsLayer);

                // used to geocode addresses
                this.locator = new Locator({
                    url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
                    outSpatialReference: new SpatialReference({wkid:4326})
                });

                // used to get z values for points
                this.elevLyr = new ElevationLayer({
                  url: "http://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
                });

                // for Viewshed analysis
                // 6 keeps failing
                this.viewshedGP = new Geoprocessor("https://sampleserver1.arcgisonline.com/arcgis/rest/services/Elevation/ESRI_Elevation_World/GPServer/Viewshed");
                this.viewshedGP.outSpatialReference = { // autocasts as new SpatialReference()
                  wkid: 102100
                };

                // for Service areas
                // this.serviveAreaGP = new Geoprocessor("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/Logistics/GPServer/GenerateServiceAreas");
                // this.serviveAreaGP.outSpatialReference = { // autocasts as new SpatialReference()
                //   wkid: 102100
                // };
                this.serviceAreaTask = new ServiceAreaTask({
                    url: "https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Service Area"
                });
                this.serviceAreaParams = new ServiceAreaParameters();
                this.serviceAreaParams.defaultBreaks= [1];
                this.serviceAreaParams.outSpatialReference = { wkid: 102100 };
                this.serviceAreaParams.returnFacilities = false;

                // used for directions. requires a proxy
                this.routeTask = new RouteTask({
                    url: "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
                });
                // Setup the route parameters
                this.routeParams = new RouteParameters({
                    stops: new FeatureSet(),
                    outSpatialReference: { // autocasts as new SpatialReference()
                      wkid: 102100
                    }
                });

                // symbols for points, polylines and polygons
                this.objectSymbol = new PointSymbol3D({
                    symbolLayers: [new ObjectSymbol3DLayer({
                      width: 10,
                      height: 10,
                      resource: {
                        primitive: "diamond"
                      },
                      material: {
                        color: "blue"
                      }
                    })]
                });

                this.fillSymbol = new SimpleFillSymbol({
                    color: [226, 119, 40, 0.75],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [255, 255, 255],
                        width: 1
                    }
                });

                this.markerSymbol = new SimpleMarkerSymbol({
                  color: [255, 0, 0],
                  outline: { // autocasts as new SimpleLineSymbol()
                    color: [255, 255, 255],
                    width: 2
                  }
                });

                this.textSymbol = new TextSymbol3DLayer({
                    material: { color: [ 49,163,84 ] },
                    size: 50  // points
                });   

                this.routeSymbol = new SimpleLineSymbol({
                    color: [0, 0, 255, 0.5],
                    width: 5
                });

                // used for current location
                this.locate = new Locate({
                  viewModel: { // autocasts as new LocateViewModel()
                    view: this.view, 
                    graphicsLayer: this.pointGraphicsLayer,
                    graphic: Graphic({
                      symbol: this.objectSymbol
                    })
                  }
                });

                var hurricaneRenderer = new SimpleRenderer({
                    symbol: new PointSymbol3D({
                      symbolLayers: [new ObjectSymbol3DLayer({
                        resource: {
                          primitive: "cone"
                        },
                        width: 50000 // width of the symol in meters
                      })]
                    }),
                    label: "hurricane location",
                    visualVariables: [{
                      type: "color",
                      field: "PRESSURE",
                      stops: [
                      {
                        value: 950,
                        color: "red"
                      },
                      {
                        value: 1020,
                        color: "blue"
                      }]
                    }, {
                      type: "size",
                      field: "WINDSPEED",
                      stops: [
                      {
                        value: 20,
                        size: 60000
                      },
                      {
                        value: 150,
                        size: 500000
                      }],
                      axis: "height"
                    }, {
                      type: "size",
                      axis: "width-and-depth",
                      useSymbolValue: true // uses the width value defined in the symbol layer (50,000)
                    }]
                });

                this.view.map.findLayerById('hurricane').renderer = hurricaneRenderer;

            },
            // helper function to return any point graphic or the center
            _getPointForAnalysis: function() {
                var point = this.pointGraphicsLayer.graphics.length > 0 && this.pointGraphicsLayer.graphics.getItemAt(0)
                    ? this.pointGraphicsLayer.graphics.getItemAt(0).geometry.spatialReference.wkid == 4326 ? webMercatorUtils.geographicToWebMercator(this.pointGraphicsLayer.graphics.getItemAt(0).geometry) : this.pointGraphicsLayer.graphics.getItemAt(0).geometry
                    : this.view.graphics.length > 0 && this.view.graphics.getItemAt(0)
                    ? this.view.graphics.getItemAt(0).geometry.spatialReference.wkid == 4326 ? webMercatorUtils.geographicToWebMercator(this.view.graphics.getItemAt(0).geometry) : this.view.graphics.getItemAt(0).geometry
                    : this.view.extent.center;

                return point;
            },
            // helper function to goTo a target
            _goTo: function(target) {
                this.view.goTo(target).then(
                    lang.hitch(this, function() {
                        this.updateStatus("command complete", false, 3000);
                    }),
                    lang.hitch(this, function() {
                        this.updateStatus("goTo error", false, 3000);
                    })
                );
            },
            // Alexa function to tilt the camera params[0] degrees
            tiltTo: function(params) {
                this.updateStatus("tilting the map", true);
                var target = {
                    center: this.view.center,
                    zoom: this.view.zoom,
                    tilt: params[0],
                    heading: this.view.camera.heading
                }
                this._goTo(target);
            },
            // Alexa function to change the heading of the camera params[0] degrees
            headingTo: function(params) {
                this.updateStatus("changing the heading of the map", true);
                var target = {
                    center: this.view.center,
                    zoom: this.view.zoom,
                    tilt: this.view.camera.tilt,
                    heading: params[0]
                }
                this._goTo(target);
            },
            // Alexa function to pan up, down, left, right. When tilt is > 0, it seems to not pan that well
            panTo: function(params) {
                this.updateStatus("panning the map", true);
                var distance = (this.view.extent.ymax-this.view.extent.ymin)/2;
                var newHeading = this.view.camera.heading;
                if (params[0] == 'down') {
                    newHeading = newHeading + 180;
                }
                else if (params[0] == 'left') {
                    newHeading = newHeading + 270;
                }
                else if (params[0] == 'right') {
                    newHeading = newHeading + 90;
                }
                if (newHeading > 360) newHeading = newHeading - 360;
                
                var x2 = this.view.extent.center.x + Math.sin(this._radians(newHeading)) * distance;
                var y2 = this.view.extent.center.y + Math.cos(this._radians(newHeading)) * distance;
                
                var point = new Point({
                    x: x2,
                    y: y2,
                    spatialReference: { wkid: 102100 }
                });
               
                this._goTo(point);
            },
            // Alexa function to zoom in or out 
            zoomTo: function(params) {
                this.updateStatus("zooming the map", true);
                var target = {
                    center: this.view.center,
                    zoom: this.view.zoom + params[0],
                    tilt: this.view.camera.tilt,
                    heading: this.view.camera.heading
                }
                this._goTo(target);
            },
            // Alexa function to go to an address. I would like to incorporate countries
            goToPlace: function(params) {
                var placeToGo = params[0] !== undefined && params[0] != null ? params[0] : params[1];
                this.updateStatus("going to " + placeToGo, true);
                
                var address = { 
                   "SingleLine": placeToGo
                };
                var addressParams = {address: address};             
                this.locator.addressToLocations(addressParams).then(lang.hitch(this, function(addresses) {
                    
                    if (addresses.length > 0) {

                        this.view.goTo({
                            target: new Extent(addresses[0].extent.xmin, addresses[0].extent.ymin, addresses[0].extent.xmax, addresses[0].extent.ymax, new SpatialReference({wkid:4326})),
                            heading: this.view.camera.heading
                        }).then(lang.hitch(this, function() {
                            this.updateStatus("command complete", false, 3000);
                        }));

                        this.pointGraphicsLayer.removeAll();
                        this.polygonGraphicsLayer.removeAll()
                        this.view.graphics.removeAll();
                        this.textGraphicsLayer.removeAll();

                        var point = new Point({
                            x: addresses[0].location.x,
                            y: addresses[0].location.y
                        });
                        this.elevLyr.queryElevation(point).then(

                            lang.hitch(this, function(result) {
                            
                                if (result.geometry) {
                                    point = new Point({
                                        x: addresses[0].location.x,
                                        y: addresses[0].location.y,
                                        z: Math.round(result.geometry.z + 5)
                                    });
                                }
                                else {
                                    point = new Point({
                                        x: addresses[0].location.x,
                                        y: addresses[0].location.y
                                    });
                                }
                                
                                var pointGraphic = new Graphic({
                                    geometry: point,
                                    symbol: this.objectSymbol
                                });

                                this.pointGraphicsLayer.add(pointGraphic);
                            }),
                            lang.hitch(this, function(error) {
                                console.error(error);
                                this.updateStatus("elevation not found", false, 3000);
                            })
                        );

                   }
                   else {
                      this.updateStatus("place not found", false, 3000);
                   }

                }));
            },
            // Alexa function to reset the map to its initial state
            resetMap: function(params) {
                this.updateStatus("resetting the map", true);
                this.pointGraphicsLayer.removeAll();
                this.polygonGraphicsLayer.removeAll();
                this.textGraphicsLayer.removeAll();
                this.view.graphics.removeAll();
                this.view.environment.atmosphereEnabled = true;

                this.view.map.basemap = 'hybrid';
                this.view.map.findLayerById('death-star').visible = false;
                this.view.map.findLayerById('hurricane').visible = false;
                
                this.view.goTo(new Camera({
                      heading: 0,
                      tilt: 0,
                      position: {
                        latitude: 21.78,
                        longitude: -101.17,
                        z: 50000000,
                        spatialReference: { wkid: 4326 }
                      }
                    })).then(
                    lang.hitch(this, function() {
                        this.updateStatus("command complete", false, 3000);
                    }),
                    lang.hitch(this, function() {
                        this.updateStatus("goTo error", false, 3000);
                    })
                );

            },
            // Alexa function to go to the user's current location. Location must be allowed on the browser
            currentLocation: function(params) {
                this.updateStatus("finding current location", true);

                this.pointGraphicsLayer.removeAll();
                this.polygonGraphicsLayer.removeAll();
                this.textGraphicsLayer.removeAll();
                this.view.graphics.removeAll();

                this.locate.locate().then(
                    lang.hitch(this, function(result) {
                        if (result && result.coords.accuracy) {
                            this.updateStatus("current location found with an accuracy of " + result.coords.accuracy, false, 3000);
                        }
                        else {
                            this.updateStatus("error locating current location", false, 3000);
                        }
                    }),
                    lang.hitch(this, function(result) {
                        this.updateStatus("error locating current location", false, 3000);
                    })
                );
            },
            // Alexa function to calculate the viewshed of a point on the map (if exists), or the center of the map.
            // from sample: https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=geoprocessing-viewshed
            viewShed: function(params) {
                this.updateStatus("calculating viewshed", true);

                var point = this._getPointForAnalysis();

                this.pointGraphicsLayer.removeAll();
                this.polygonGraphicsLayer.removeAll();
                this.textGraphicsLayer.removeAll();
                this.view.graphics.removeAll();
                var pointGraphic = new Graphic({
                    geometry: point,
                    symbol: this.markerSymbol
                });
                this.pointGraphicsLayer.add(pointGraphic);

                var inputGraphicContainer = [];
                inputGraphicContainer.push(pointGraphic);
                var featureSet = new FeatureSet();
                featureSet.features = inputGraphicContainer;

                var vsDistance = new LinearUnit();
                vsDistance.distance = 5;
                vsDistance.units = "miles";

                var vsparams = {
                   "Input_Observation_Point": featureSet,
                   "Viewshed_Distance": vsDistance
                };

                this.viewshedGP.execute(vsparams).then(

                    lang.hitch(this, function(result) {
                    
                        var resultFeatures = result.results[0].value.features;

                        // Assign each resulting graphic a symbol
                        var viewshedGraphics = resultFeatures.map(lang.hitch(this, function(feature) {
                            feature.symbol = this.fillSymbol;
                            return feature;
                        }));

                        // Add the resulting graphics to the graphics layer
                        this.polygonGraphicsLayer.addMany(viewshedGraphics);
                        
                        this.view.goTo(viewshedGraphics).then(lang.hitch(this, function() {
                            this.updateStatus("command complete", false, 3000);
                        }));
                    
                    }), 
                    lang.hitch(this, function(error) {
                        this.updateStatus(error.message, false, 3000);
                        console.error(error.message);
                        console.error(error.details);
                    })
                );

            },
            // Alexa function to remove all graphics on the map
            removeAllGraphics: function(params) {
                this.updateStatus("removing all graphics", true);
                this.pointGraphicsLayer.removeAll();
                this.polygonGraphicsLayer.removeAll();
                this.textGraphicsLayer.removeAll();
                this.view.graphics.removeAll();
                this.updateStatus("all graphics removed", false, 3000);

                this.view.map.findLayerById('death-star').visible = false;
                this.view.map.findLayerById('hurricane').visible = false;
            },
            // used by spinTheGlobe to set the camera up for the next spin
            _shiftCamera: function(deg) {
              var camera = this.view.camera.clone();
              camera.position.longitude += deg;
              return camera;
            },
            // recursive function to keep on spinning the globe
            _spinnerRecursive: function() {
                if (this.keepSpinning) {
                    this.view.goTo(
                        // negative to spin the correct way
                        this._shiftCamera(-179),
                        {
                          speedFactor: 0.1,
                          easing: "linear"
                        }
                    ).then(lang.hitch(this, function() {
                        this._spinnerRecursive();
                    }));
                }
                else {
                    // this.view.environment.lighting.date = null;
                    // this.view.environment.lighting.directShadowsEnabled = false;
                    this.updateStatus("spin complete", false, 3000);
                }
            },
            // Alexa function to spin the globe
            spinTheGlobe: function(params) {
                this.updateStatus("spinning the globe", true);
                // this.view.environment.lighting.date = Date.now();
                // this.view.environment.lighting.directShadowsEnabled = true;
                this.keepSpinning = true;
                this.view.goTo({
                            heading: 0,
                            tilt: 0,
                            position: {
                                latitude: 0,
                                longitude: webMercatorUtils.webMercatorToGeographic(this.view.center).x,
                                z: 50000000,
                                spatialReference: { wkid: 4326 }
                            }
                        })
                        .then(lang.hitch(this, function() {
                            this._spinnerRecursive();
                        }));
                     
                ;
            },
            // Alexa function to stop all animation that might be currently happening
            stopAnimation: function(params, dontShowStatus) {
                this.keepSpinning = false;
                this.keepShaking = false;
                this.keepFlying = false;
                if (this.view.animation !== null && this.view.animation.state == "running") {
                    this.view.animation.stop();
                }
                if (dontShowStatus === undefined) {
                    this.updateStatus("animation stopped", false, 3000);
                }
            },
            // Alexa function to buffer a point on the map (if exists), or the center of the map params[0] feet.
            // from sample: https://developers.arcgis.com/javascript/latest/sample-code/ge-geodesicbuffer/index.html
            bufferPoint: function(params) {
                this.updateStatus("buffering the point " + params[0] + " feet", true);
                var point = this._getPointForAnalysis();

                this.pointGraphicsLayer.removeAll();
                this.polygonGraphicsLayer.removeAll();
                this.textGraphicsLayer.removeAll();
                this.view.graphics.removeAll();

                if (point.z !== undefined) {
                    point.z=undefined;
                }

                var pointGraphic = new Graphic({
                    geometry: point,
                    symbol: this.markerSymbol
                });
                this.pointGraphicsLayer.add(pointGraphic);

                geometryEngineAsync.buffer(point, params[0], "feet").then(
                    lang.hitch(this, function(response) {
                        var ptBuffGraphic = new Graphic({
                            geometry: response,
                            symbol:this.fillSymbol
                        });
                        this.polygonGraphicsLayer.add(ptBuffGraphic);
                        this.view.goTo(ptBuffGraphic).then(lang.hitch(this, function() {
                            this.updateStatus("command complete", false, 3000);
                        }));
                    }),
                    lang.hitch(this, function(error) {
                        this.updateStatus("error buffering point", false, 3000);
                    })
                );
                
                
            },
            // helper function for fyBy
            _radians: function(n) {
                return n * (Math.PI / 180);
            },
            // helper function for fyBy
            _degrees: function(n) {
                return n * (180 / Math.PI);
            },
            // helper function for fyBy
            _getBearing: function(point1, point2) {
                if (!point2) {
                    return null;
                }
                var startLat = point1.y;
                var startLong = point1.x;
                var endLat = point2.y;
                var endLong = point2.x;
                var startLat = this._radians(startLat);
                var startLong = this._radians(startLong);
                var endLat = this._radians(endLat);
                var endLong = this._radians(endLong);
                
                var dLong = endLong - startLong;
                
                var dPhi = Math.log(Math.tan(endLat/2.0+Math.PI/4.0)/Math.tan(startLat/2.0+Math.PI/4.0));
                if (Math.abs(dLong) > Math.PI){
                  if (dLong > 0.0)
                     dLong = -(2.0 * Math.PI - dLong);
                  else
                     dLong = (2.0 * Math.PI + dLong);
                }
                
                var brng = (this._degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
                
                return brng;
            },
            // helper function for fyBy
            _getBearingForMerc: function(p1, p2) {
                if (!p2) {
                    return null;
                }
                p1 = webMercatorUtils.geographicToWebMercator(p1);
                p2 = webMercatorUtils.geographicToWebMercator(p2);
                var brng = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
                if (brng < 0) brng = 360 + brng;

                return brng;
            },
            // helper function for fyBy
            _getFlyByTarget: function(geometry, previousGeometry) {
                if (!geometry) {
                    return [{},{}];
                }

                var duration = 3000;
                var heading = this.view.camera.heading;
                if (previousGeometry) {
                    // duration of flight time is based on distance to the next point so the speed during the fly over will be consistent
                    var distance = geometryEngine.distance(webMercatorUtils.geographicToWebMercator(previousGeometry), webMercatorUtils.geographicToWebMercator(geometry), "feet");
                    duration = (distance / 2640) * 3000;

                    // during the heading turn, the camera's center point changed. The heading to the next point needs to be from the cameras current center.
                    heading = this._getBearing(webMercatorUtils.webMercatorToGeographic(this.view.camera.position),geometry); //this.view.extent.center  this.view.center
                }

                var target = [{
                    position: {
                        x: geometry.x,
                        y: geometry.y,
                        z: geometry.z,
                        spatialReference: {
                            wkid: 4326
                        }
                    },
                    heading: heading,
                    tilt: 80
                }, {
                    duration: duration,
                    easing: 'linear'
                }];
                return target;
            },
            // helper function for fyBy
            _flyByRecursive: function(index, doHeading) {
                if (this.keepFlying) {
                    if (this.pointGeometries[index] !== undefined) {
                        if (doHeading) {

                            // _getBearing takes 2 lat,lng points and finds the heading.
                            // _getBearingForMerc takes 2 web mercator points and finds the heading. Way easier, but I kept getting the headings in reverse order. Very strange.

                            var heading = this._getBearing(this.pointGeometries[index],this.pointGeometries[index+1]);
                            //var heading = this._getBearingForMerc(this.pointGeometriesForHeading[index],this.pointGeometriesForHeading[index+1]);
                            //var target = heading == null ? {target:this.flyByPolyline,tilt:0,heading:0} : {target:this.pointGeometries[index],heading:heading};
                            var target = heading == null ? {target:this.flyByPolyline,tilt:0,heading:0} : {heading:heading};
                            this.view.goTo(target,{duration:3000}).then(
                                lang.hitch(this, function(){
                                    this._flyByRecursive(index+1,false);
                                })
                            );
                        }
                        else {
                            var target = this._getFlyByTarget(this.pointGeometries[index],this.pointGeometries[index-1]);
                            if (this.pointGeometries[index].venueNames) {
                                this.updateStatus("flying to " + this.pointGeometries[index].venueNames, true);
                            }
                            this.view.goTo(target[0],target[1]).then(
                                lang.hitch(this, function(){
                                    this._flyByRecursive(index,true);
                                })
                            );
                        }
                    }
                    else {
                        this.keepFlying = false;
                        this.updateStatus("flyover complete", false, 3000);
                    }
                }
            },
            // Alexa function to fly over a city passed in on params[0]. Basically I am using foursquare api to get 5 points of interest and animating the camera to follow the points. It's a little more involved, but that is the basis of it.
            flyBy: function(params) {

                this.pointGraphicsLayer.removeAll();
                this.polygonGraphicsLayer.removeAll();
                this.textGraphicsLayer.removeAll();
                this.view.graphics.removeAll();
    
                // foursquare full url call
                // https://api.foursquare.com/v2/venues/explore?v=20161016&near=cincinnati,ohio&section=sights&limit=10&venuePhotos=1&sortByDistance=0&client_id=QMLHIQUXNTXVSCDPNRXZHVEAUDD3UURGZGXIQZTCQCU3S2XG&client_secret=JAKDBNFVCDPMF5NULZIR0TO3XYL40MCEQIEWSDPUC5HHWWAJ
                // google example
                // https://maps.googleapis.com/maps/api/place/textsearch/json?query=cincinnati+ohio+point+of+interest&language=en&key=AIzaSyAj8oJAC_3AlDwqQaSbIx2J3nItqi0SIyk
                
                this.updateStatus("finding points of interest for " + params[0], true);
                var data = {
                    v: '20161016',
                    near: params[0],
                    section: 'sights',
                    limit: 5,
                    venuePhotos: 1,
                    sortByDistance: 0,
                    client_id: config.FS_CLIENT_ID,
                    client_secret: config.FS_CLINET_SECRET
                };

                // using script instead of request
                script.get("https://api.foursquare.com/v2/venues/explore", {
                    jsonp: "callback",
                    query: data
                }).then(
                    lang.hitch(this, function(response){

                        if (response.meta.code == 200 && response.response.groups.length > 0) {
                            this.updateStatus("formulating flight plan for " + params[0], true);
                            
                            var tempPointGeometries = [];
                            for (var x=0;x < response.response.groups[0].items.length;x++) {

                                var point = new Point({
                                    x: response.response.groups[0].items[x].venue.location.lng,
                                    y: response.response.groups[0].items[x].venue.location.lat
                                });
                                //point = webMercatorUtils.geographicToWebMercator(point);
                                tempPointGeometries.push(point);
                                tempPointGeometries[x].venueNames = response.response.groups[0].items[x].venue.name;
                                // maybe show the venue names on 3d text?
                                //this.textSymbol
                                //this.textGraphicsLayer
                            }

                            var paths = [];
                            var path = [];
                            var point2 = [];
                            point2.push(tempPointGeometries[0].x);
                            point2.push(tempPointGeometries[0].y);
                            path.push(point2);
                            this.pointGeometries = [];
                            this.pointGeometries.push(tempPointGeometries[0]);
                            var indexesUsed = [];

                            // to make things more complicated, I decided to start with point 0 and sort the points based on distance from the previous point. It makes for a better tour of the city (I think)
                            for (var x=1;x < tempPointGeometries.length;x++) {
                                
                                var distance = -1;
                                var nextClosestIndex = -1;
                                for (var xx=1;xx < tempPointGeometries.length;xx++) {
                                    
                                    var pointDistance = geometryEngine.distance(webMercatorUtils.geographicToWebMercator(this.pointGeometries[x-1]), webMercatorUtils.geographicToWebMercator(tempPointGeometries[xx]), "feet");
                                    if (pointDistance > 1 && (pointDistance < distance || distance == -1) && indexesUsed.indexOf(xx) == -1) {
                                        nextClosestIndex = xx;
                                        distance = pointDistance;
                                    }
                                    if (xx == tempPointGeometries.length-1 && nextClosestIndex != -1) {
                                        indexesUsed.push(nextClosestIndex);
                                    }
                                    
                                }
                                this.pointGeometries.push(tempPointGeometries[nextClosestIndex]);
                               
                                point2 = [];
                                point2.push(tempPointGeometries[nextClosestIndex].x);
                                point2.push(tempPointGeometries[nextClosestIndex].y);
                                path.push(point2);
                                
                            }

                            // used if using bearing for mercator
                            // this.pointGeometriesForHeading = [];
                            // for (var x=this.pointGeometries.length - 1;x >= 0;x--) {
                            //     this.pointGeometriesForHeading.push(this.pointGeometries[x]);
                            // }
                          
                            paths.push(path);
                            this.flyByPolyline = new Polyline({
                                paths: paths,
                                spatialReference: new SpatialReference({wkid:4326})
                            });

                            this.elevLyr.queryElevation(this.flyByPolyline).then(

                                lang.hitch(this, function(result) {
                            
                                    if (result.geometry && result.geometry.paths.length > 0) {
                                        
                                        for (var x=0;x < result.geometry.paths[0].length;x++) {
                                            this.pointGeometries[x].z = result.geometry.paths[0][x][2] + 500;
                                        }

                                        this.flyByPolyline = webMercatorUtils.geographicToWebMercator(this.flyByPolyline);

                                        // nice to show the polyline for testing
                                        // var polylineGraphic = new Graphic({
                                        //     geometry: this.flyByPolyline,
                                        //     symbol: new SimpleLineSymbol({
                                        //         color: [226, 119, 40],
                                        //         width: 4
                                        //     })
                                        // });
                                        // this.polygonGraphicsLayer.add(polylineGraphic);

                                        // start the fly over sequence by zooming to the extent of the track line and shifting the heading +10 before zooming to point 0. It adds a nice effect that I did by accident
                                        this.view.goTo({target:this.flyByPolyline,tilt:0,heading:0})
                                            .then(lang.hitch(this, function() {
                                                this.updateStatus("starting fly over of " + params[0], true);
                                                return this.view.goTo({heading:10},{duration:3000});
                                            }))
                                            .then(lang.hitch(this, function() {
                                                this.keepFlying = true;
                                                this._flyByRecursive(0, false);
                                            }));
                                    }
                                    else {
                                        this.updateStatus("error during fly over", false, 3000);
                                    }
                                    
                                }),
                                lang.hitch(this, function(error) {
                                    console.error(error);
                                    this.updateStatus("error during fly over", false, 3000);
                                })

                            );

                            
                        }
                        else {
                            this.updateStatus("error on flyover", false, 3000);
                        }

                    }), 
                    lang.hitch(this, function(err){
                        this.updateStatus("error on flyover", false, 3000);
                        console.error(err);
                    })

                );

            },
            // recursive function for shakeTheMap to keep shaking
            _shakeRecursive: function(index) {
                if (this.keepShaking) {
                    var newIndex = index;
                    this.view.goTo(
                        {
                            target: this.viewPorts[index]
                        },
                        {
                            // that's fast
                            speedFactor: 6,
                            easing: 'linear'
                        }
                    ).then(lang.hitch(this, function() {
                        // if the new random index is the same as the current index, the map will sometimes stall and not move. The while loop just makes sure a new index is selected
                        while (newIndex == index) {
                            newIndex = Math.floor(Math.random() * (5 - 0) + 0);
                        }
                        this._shakeRecursive(newIndex);
                    }));
                }
                else {
                    this.updateStatus("earthquake complete", false, 3000);
                }
            },
            // Alexa function to shak the map like an earthquake. I made it work at any scale by getting points close to the center based on the current scale of the map
            shakeTheMap: function(params) {
                this.updateStatus('EARTHQUAKE!!!', true);
                this.keepShaking = true;
                var xydistance = this.view.viewpoint.scale*0.0196;
                //var xydistance = this.view.camera.position.z*0.0196;

                this.viewPorts = [];
                this.viewPorts.push(new Viewpoint({
                    scale: this.view.viewpoint.scale,
                    targetGeometry: this.view.extent.center
                }));
                this.viewPorts.push(new Viewpoint({
                    scale: this.view.viewpoint.scale,
                    targetGeometry: new Point({
                        x: this.view.extent.center.x + xydistance,
                        y: this.view.extent.center.y,
                        spatialReference: { wkid: 102100 }
                    })
                }));
                this.viewPorts.push(new Viewpoint({
                    scale: this.view.viewpoint.scale,
                    targetGeometry: new Point({
                        x: this.view.extent.center.x,
                        y: this.view.extent.center.y + xydistance,
                        spatialReference: { wkid: 102100 }
                    })
                }));
                this.viewPorts.push(new Viewpoint({
                    scale: this.view.viewpoint.scale,
                    targetGeometry: new Point({
                        x: this.view.extent.center.x - xydistance,
                        y: this.view.extent.center.y,
                        spatialReference: { wkid: 102100 }
                    })
                }));
                this.viewPorts.push(new Viewpoint({
                    scale: this.view.viewpoint.scale,
                    targetGeometry: new Point({
                        x: this.view.extent.center.x,
                        y: this.view.extent.center.y - xydistance,
                        spatialReference: { wkid: 102100 }
                    })
                }));
                
                this.view.goTo({heading:10}).then(
                    lang.hitch(this, function() {
                        var index = Math.floor(Math.random() * (5 - 0) + 0);
                        this._shakeRecursive(index);
                    }));
                  

            },
            // Alexa function to turn on badassery
            switchToStarWars: function(params) {
                this.updateStatus('may the force be with you', false, 5000);
                this.view.map.findLayerById('hurricane').visible = false;
                this.view.environment.atmosphereEnabled = false;
                if(this.keepSpinning) {
                    this.view.map.basemap = 'satellite';
                    this.view.map.findLayerById('death-star').visible = true;
                }
                else {
                    this.view.goTo({
                            heading: 0,
                            tilt: 0,
                            position: {
                                latitude: 20,
                                longitude: webMercatorUtils.webMercatorToGeographic(this.view.center).x,
                                z: 50000000,
                                spatialReference: { wkid: 4326 }
                            }
                        }).then(
                        lang.hitch(this, function() {
                            this.view.map.basemap = 'satellite';
                            this.view.map.findLayerById('death-star').visible = true;
                        })
                    );  
                }
                

                
            },
            // Alexa function to show Atlantic ocean hurricanes from 2000
            showHurricane: function(params) {
                this.updateStatus('showing hurricanes for 2000', false, 5000);
                this.view.map.findLayerById('hurricane').visible = true;
                this.view.goTo({ // autocasts as new Camera()
                    position: { // autocasts as new Point()
                      x: -7094839,
                      y: -113987,
                      z: 8032780,
                      spatialReference: {
                        wkid: 3857
                      } // autocasts as new SpatialReference()
                    },
                    heading: 358.8,
                    tilt: 13.7
                });
            },
            // Alexa function to show service areas based on a point
            showServiceAreas: function(params) {
                this.updateStatus("calculating drive times", true);
                var point = this._getPointForAnalysis();

                this.pointGraphicsLayer.removeAll();
                this.polygonGraphicsLayer.removeAll();
                this.textGraphicsLayer.removeAll();
                this.view.graphics.removeAll();
                var pointGraphic = new Graphic({
                    geometry: point,
                    symbol: this.markerSymbol
                });
                this.pointGraphicsLayer.add(pointGraphic);

                this.serviceAreaParams.defaultBreaks = [ params[0] ];
                var features = [];
                features.push(pointGraphic);
                var facilities = new FeatureSet();
                facilities.features = features;
                this.serviceAreaParams.facilities = facilities;

                this.serviceAreaTask.solve(this.serviceAreaParams).then(
                //this.serviveAreaGP.execute(saparams).then(

                    lang.hitch(this, function(result) {
                    
                        var resultFeatures = result.serviceAreaPolygons;

                        // Assign each resulting graphic a symbol
                        var serviceAreaGraphics = resultFeatures.map(lang.hitch(this, function(feature) {
                            feature.symbol = this.fillSymbol;
                            return feature;
                        }));

                        // Add the resulting graphics to the graphics layer
                        this.polygonGraphicsLayer.addMany(serviceAreaGraphics);
                        
                        this.view.goTo(serviceAreaGraphics).then(lang.hitch(this, function() {
                            this.updateStatus("command complete", false, 3000);
                        }));
                    
                    }), 
                    lang.hitch(this, function(error) {
                        this.updateStatus(error.message, false, 3000);
                        console.error(error.message);
                        console.error(error.details);
                    })
                );

            },
            // under development
            // I would like to implement and use the flyBy code to follow the polyline. It does requires a proxy though
            // https://developers.arcgis.com/javascript/latest/sample-code/tasks-route/index.html
            getDirections: function(params) {
                
                this.pointGraphicsLayer.removeAll();
                this.polygonGraphicsLayer.removeAll()
                this.view.graphics.removeAll();
                this.textGraphicsLayer.removeAll();

                var stop1 = new Graphic({
                    geometry: this._getPointForAnalysis(),
                    symbol: this.markerSymbol
                });
                this.polygonGraphicsLayer.add(stop1); 
                this.routeParams.stops.features.push(stop1);

                var address = { 
                   "SingleLine": params[0]
                };
                var addressParams = {address: address};             
                this.locator.addressToLocations(addressParams).then(
                    lang.hitch(this, function(addresses) {

                        if (addresses.length > 0) {

                            var point = new Point({
                                x: addresses[0].location.x,
                                y: addresses[0].location.y
                            });

                            var stop2 = new Graphic({
                                geometry: point,
                                symbol: this.markerSymbol
                            });
                            this.polygonGraphicsLayer.add(stop2); 
                            this.routeParams.stops.features.push(stop2);
                            
                            this.routeTask.solve(this.routeParams).then(
                                lang.hitch(this, function(data) {
                                    var routeResult = data.routeResults[0].route;
                                    routeResult.symbol = this.routeSymbol;
                                    this.polygonGraphicsLayer.add(routeResult);

                                    // flyby here
                                }),
                                lang.hitch(this, function(error) {
                                    console.error(error);
                                })
                            );
                        }
                        else {

                        }

                    }),
                    lang.hitch(this, function(error) {
                        console.error(error);
                    })
                );
            },
            showHelp: function(params) {
                fx.wipeIn({
                    node: "helpDiv",
                    duration: 300
                }).play();
            },
            closeHelp: function(params) {
                fx.wipeOut({
                    node: "helpDiv",
                    duration: 300
                }).play();
            },
            // another option to develop
            // https://developers.arcgis.com/javascript/latest/sample-code/geoprocessing-hotspot/index.html
            hotSpot: function(params) {
                
            },
            // main function to update the status on the page
            updateStatus: function(message, showThinking, timer) {
                html.set('statusDiv', message);
                domAttr.set('statusThinking', 'src', showThinking ? 'img/thinking.gif' : 'img/thinking.png');
                if (timer) {
                    setTimeout(function(){ 
                        html.set('statusDiv', 'waiting for a command from Alexa');
                        domAttr.set('statusThinking', 'src', 'img/thinking.png');
                    }, timer);
                }
            }

        });
});
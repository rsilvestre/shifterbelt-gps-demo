/**
 * Created by michaelsilvestre on 22/06/15.
 */

var ShifterbeltClient = require('shifterbelt-talker');
var socket = require('socket.io');

var ShifterbeltToSocketIO = function(server) {

  if (false === (this instanceof ShifterbeltToSocketIO)) {
    return new ShifterbeltClient(server);
  }

  /**
   * Create Socket.io
   */
  var io = socket(server);

  /**
   * Create Shifterbelt
   */
  var shifterbeltClient = new ShifterbeltClient({
    url: process.env.DEMO_URL || String(process.argv.slice(2, 3)[0]), // Default : http://socket.shifterbelt.com/ns
    applicationId: Number(process.env.DEMO_APP_ID) || Number(process.argv.slice(3, 4)[0]),
    key: process.env.DEMO_KEY || process.argv.slice(4, 5)[0],
    password: process.env.DEMO_PASSWORD || process.argv.slice(5, 6)[0]
  });

  /**
   * Queue system
   */
  var context = require('rabbit.js').createContext('amqp://localhost');
  context.on('ready', function() {
    var devices = {};

    shifterbeltClient.on('connect', function(sbSoc) {
      console.log('Shifterbelt connected');

      sbSoc.on('connect', function(service) {
        console.log("sb connected");

        devices[service.deviceId] = true;

        var pub = context.socket('PUB', { routing: 'topic' });
        var dataDown = context.socket('SUB', { routing: 'topic' });

        //dataDown.pipe(process.stdout);
        dataDown.setEncoding('utf8');

        dataDown.connect('events2', 'dataDown|' + service.deviceId, function() {
          pub.connect('events1', function() {
            pub.connect('events2', function() {
              console.log('shifterbelt queue connected');

              service.on('disconnect', function() {
                console.log('shifterbelt disconnected');

                try {
                  pub.publish('dataUp', JSON.stringify({
                    key: 'deviceDisconnected',
                    value: { sender: service.deviceId, message: 'disconnected' }
                  }));
                } catch (e) {
                  console.error(e);
                }

                delete(devices[service.deviceId]);

                try {
                  pub.close();
                  dataDown.close();
                } catch (e) {
                  console.error(e);
                }
              });

              pub.publish('dataUp', JSON.stringify({
                key: 'deviceConnected',
                value: { sender: service.deviceId, message: 'connected' }
              }));

              service.on('gps_data', function(message) {
                //console.log('sender: ' + sender + ' message: ' + message);
                pub.publish('dataUp', JSON.stringify({
                  key: 'gps_data',
                  value: { sender: service.deviceId, message: message }
                }));
              });

              service.on('status', function(message) {
                //console.log('sender: ' + sender + ' message: ' + message);
                pub.publish('dataUp', JSON.stringify({
                  key: 'status',
                  value: { sender: service.deviceId, message: message }
                }));
              });

              dataDown.on('data', function(data) {
                //console.log("dataDown datas: %s", data);
                //ioSoc.emit('gps_data', { sender: service.deviceId, message: message });
                data = JSON.parse(data);
                service.emit(data.key, data.value);
              });

            });
          });
        });

      });
    });

    io.on('connection', function(ioSoc) {
      console.log("io connected");

      ioSoc.emit('devices', devices);

      var pub = context.socket('PUB', { routing: 'topic' });
      var dataUp = context.socket('SUB', { routing: 'topic' });

      ioSoc.on('disconnect', function() {
        console.log('socket.io disconnected: %', ioSoc.id);
        pub.close();
        dataUp.close();
      });

      //dataUp.pipe(process.stdout);
      dataUp.setEncoding('utf8');

      dataUp.connect('events1', 'dataUp', function() {
        pub.connect('events1', function() {
          pub.connect('events2', function() {
            console.log('socket.io queue connected');
            //pub.publish('dataDown', JSON.stringify({ welcome: 'rabbit.js dataDown' }), 'utf8');

            dataUp.on('data', function(data) {
              //console.log("dataUp datas: %s", data);
              //ioSoc.emit('gps_data', { sender: service.deviceId, message: message });
              data = JSON.parse(data);
              ioSoc.emit(data.key, { sender: data.value.sender, message: data.value.message });
            });

            ioSoc.on('command', function(command) {
              pub.publish('dataDown|' + command.sender, JSON.stringify({ key: 'command', value: command.name }));
            });
          });
        });
      });
    });

  });

};

module.exports = ShifterbeltToSocketIO;
/*
 * Bolt server client-side app
 * Cam Pedersen
 */

var socket = io.connect();

socket.on('message', function (data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log('Could not parse: ' + data);
    return;
  }
  var row = $('<tr class="event" />');
  if (data.data) $('<td class="data" />').text(JSON.stringify(data.data)).prependTo(row);
  $('<td />').text(data.hook).prependTo(row);
  $('<td class="timestamp" />').text(+new Date).prependTo(row);
  row.prependTo($('#window'));
  if ($('.event').length > 100) $('.event').last().remove();
});

setInterval(function(){
  $(".timestamp").prettyDate();
}), 1000;


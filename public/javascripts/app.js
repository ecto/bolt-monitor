/*
 * Bolt server client-side app
 * Cam Pedersen
 */

var socket = io.connect();

socket.on('broadcast', function (data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log('Could not parse: ' + data);
    return;
  }
  var row = $('<tr class="event" />');
  if (data.data) $('<td class="data" />').text(JSON.stringify(data.data)).prependTo(row);
  $('<td />').text(data.id + ' ' + data.hook).prependTo(row);
  $('<td class="timestamp" />').text(+new Date).prependTo(row);
  row.prependTo($('#window'));
  if ($('.event').length > 100) $('.event').last().remove();
});

socket.on('connect', function (id) {
  if (!id) return;
  var row = $('<tr class="event connect" />');
  $('<td />').text(id + ' connected').prependTo(row);
  $('<td class="timestamp" />').text(+new Date).prependTo(row);
  row.prependTo($('#window'));
  if ($('.event').length > 100) $('.event').last().remove();
});

socket.on('disconnect', function (id) {
  if (!id) return;
  var row = $('<tr class="event disconnect" />');
  $('<td />').text(id + ' disconnected').prependTo(row);
  $('<td class="timestamp" />').text(+new Date).prependTo(row);
  row.prependTo($('#window'));
  if ($('.event').length > 100) $('.event').last().remove();
});

socket.on('changename', function (data) {
  var row = $('<tr class="event changename" />');
  $('<td />').text(data.old + ' changed name to ' + data.now).prependTo(row);
  $('<td class="timestamp" />').text(+new Date).prependTo(row);
  row.prependTo($('#window'));
  if ($('.event').length > 100) $('.event').last().remove();
});

setInterval(function(){
  $(".timestamp").prettyDate();
}), 1000;


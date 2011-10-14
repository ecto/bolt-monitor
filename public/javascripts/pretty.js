// http://ejohn.org/blog/javascript-pretty-date/
function prettyDate(time){
  var date = +new Date(time),
      diff = (+new Date() - time) / 1000,
  day_diff = Math.floor(diff / 86400);

  if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) return;
  return day_diff == 0 && (
   diff < 2 && "just now" ||
   diff < 60 && Math.floor(diff) + " seconds ago" ||
   diff < 120 && "1 minute ago" ||
   diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
   diff < 7200 && "1 hour ago" ||
   diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
  day_diff == 1 && "Yesterday" ||
  day_diff < 7 && day_diff + " days ago" ||
  day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
}

// If jQuery is included in the page, adds a jQuery plugin to handle it as well
if (typeof $ != "undefined")
  $.fn.prettyDate = function(){
    return this.each(function(){
      if (!$(this).attr('data-time')) {
        $(this).attr('data-time', $(this).text());
      }
      var pretty = prettyDate($(this).attr('data-time'));
      if (pretty) $(this).text(pretty);
    });
  };

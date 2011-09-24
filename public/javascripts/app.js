/*
 * Bolt server client-side app
 * Cam Pedersen
 */

(function($) {
  var view   = null,
      pool   = [],
      events = [];

  var app = $.sammy('#window', function() {  
    this.use('Template');

    /*
     * GET /
     */
    this.get('#/', function(context) {
      view = 'home';
      title();

      this
        .render('/templates/home.template')
        .swap();

      this.load('/pool')
        .then(function(clients){
          pool = clients;
          context.log(pool);
          return clients;
        })
        .renderEach('/templates/item.template')
        .then(function(clients){
          $('#clients').html(clients);
        });

      this.renderEach('/templates/event.template', events.slice(-19).reverse())
        .then(function(d){
          $('#events').html(d);
        });

    });


    /*
     * GET /id
     */
    this.get('#/:id', function(context) {
      var id = this.params['id'];
      view = id;
      title([id]);
      var i;
      for (var j in pool) {
        if (pool[j].id == id) {
          i = j;
          break;
        }
      }
      if (!i || !pool[i]) this.redirect('#/');
      else {
        this.render('/templates/client.template', { client: pool[i] }).swap();

        var cevents = [];
        for (var i in events) {
          if (events[i].id == id) cevents.push(events[i]);
          if (cevents.length == 20) break;
        }
        this.renderEach('/templates/event.template', cevents.reverse())
            .then(function(d){
              $('#events').html(d);
            });
      }
    });

    /*
     * Broadcasted event handler
     */
    this.bind('event', function(e, data){
      var t = e.timestamp;
      if (view != 'home' && view != data.id) return;
      this.render('/templates/event.template', data)
          .then(function(r){
            $(r).prependTo("#events");
            if ($('.event').length > 20) $('.event').last().remove();
          });
    });

  });

  function title(crumb){
      var start = '<a href="/#/">status</a>';
      crumb = (crumb ? ' / ' + crumb : '');
      var title = start + crumb;
      $('#title').html(title);
  }
      
  $(function() {
    var socket = io.connect();
    socket.on('broadcast', function (data) {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.log('Could not parse: ' + data);
        return;
      }
      events.push(data);
      if (events.length > 100) events.shift();
      app.trigger('event', data);
    });
    app.run('#/');
  });

})(jQuery);

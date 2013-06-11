var Screw = (function($) {
  var screw = {
    Unit: function(fn) {
      var contents = fn.toString().match(/^[^\{]*{((.*\n*)*)}/m)[1];
      var fn = new Function("matchers", "specifications",
        "with (specifications) { with (matchers) { " + contents + " } }"
      );

      $(Screw).queue(function() {
        var this_element = this;
        setTimeout(function() {
          Screw.Specifications.context.push($('body > .describe'));
          fn.call(this_element, Screw.Matchers, Screw.Specifications);
          Screw.Specifications.context.pop();
          $(this_element).dequeue();
        }, 0);
      });
    },

    Specifications: {
      context: [],

      describe: function(name, fn) {
        var describe = $('<li class="describe"></li>')
          .append($('<h1></h1>').text(name))
          .append('<ol class="befores"></ol>')
          .append('<ul class="its"></ul>')
          .append('<ul class="describes"></ul>')
          .append('<ol class="afters"></ol>');

        this.context.push(describe);
        fn.call();
        this.context.pop();

        this.context[this.context.length-1]
          .children('.describes')
            .append(describe);
      },

      it: function(name, fn) {
        var it = $('<li class="it"></li>')
          .append($('<h2></h2>').text(name));

        if(/(waitFor|run)\s*\(\s*/.test(fn.toString().replace(/"((\\")|[^"])*"/g, "").replace(/'((\\')|[^'])*'/g, ""))) {
          it.data('screwunit.asyncJobs', []);

          this.context.push(it);
          fn.call();
          this.context.pop();
        } else {
          it.data('screwunit.run', fn);
        }

        this.context[this.context.length-1]
          .children('.its')
            .append(it);
      },

      waitFor: function(fn) {
        var timeout = 5000; // default timeout is 5 seconds
        var description = "waitFor job didn't complete in time ("+timeout+"ms timeout exceeded)"; // default description
        var options;

        if($.isPlainObject(fn)) {
          options = fn;
          fn = options.run;
        }

        var ctx = this.context[this.context.length-1];
        $.extend(fn, {
          type: "waitFor",
          description: description,
          timeout: timeout
        }, options);
        ctx.data('screwunit.asyncJobs').push(fn);
      },

      run: function(fn) {
        var ctx = this.context[this.context.length-1];
        ctx.data('screwunit.asyncJobs').push(fn);
      },

      before: function(fn) {
        var before = $('<li class="before"></li>')
          .data('screwunit.run', fn);

        this.context[this.context.length-1]
          .children('.befores')
            .append(before);
      },

      after: function(fn) {
        var after = $('<li class="after"></li>')
          .data('screwunit.run', fn);

        this.context[this.context.length-1]
          .children('.afters')
            .append(after);
      }
    }
  };

  $(screw).queue(function() { $(screw).trigger('loading') });
  
  $(window).load(function(){
    $('<div class="describe"></div>')
      .append('<h3 class="status"></h3>')
      .append('<ol class="befores"></ol>')
      .append('<ul class="describes"></ul>')
      .append('<ol class="afters"></ol>')
      .appendTo('body');

    $('.status').text('Scanning for specs...');

    $(Screw).queue(function() {
      $(screw).trigger('loaded');
      $(screw).dequeue();
    });
    $(screw).dequeue();
  });

  return screw;
})(jQuery);
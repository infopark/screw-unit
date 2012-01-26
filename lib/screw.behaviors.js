(function($) {
  $(Screw).bind('loaded', function() {
    $('.status').fn({
      display: function() {
        $(this).html(
          $('.passed').length + $('.failed').length + ' test(s), ' + $('.failed').length + ' failure(s)<br />' +
          ((new Date() - Screw.suite_start_time)/1000.0).toString() + " seconds elapsed"
        );
      }
    });

    $('.describe').fn({
      parent: function() {
        return $(this).parent('.describes').parent('.describe');
      },
      
      run_befores: function() {
        $(this).fn('parent').fn('run_befores');
        $(this).children('.befores').children('.before').fn('run');
      },
      
      run_afters: function() {
        $(this).fn('parent').fn('run_afters');
        $(this).children('.afters').children('.after').fn('run');
      },
      
      enqueue: function() {
        $(this).children('.its').children('.it').fn('enqueue');
        $(this).children('.describes').children('.describe').fn('enqueue');
      },
      
      selector: function() {
        return $(this).fn('parent').fn('selector')
          + ' > .describes > .describe:eq(' + $(this).parent('.describes').children('.describe').index(this) + ')';
      }
    });
  
    $('body > .describe').fn({
      selector: function() { return 'body > .describe' }
    });
    
    $('.it').fn({
      parent: function() {
        return $(this).parent('.its').parent('.describe');
      },
      
      run: function() {
        var self = $(this);

        function trigger(type, description) {
          self.trigger(type, description);
          self.fn('parent').fn('run_afters');
          setTimeout(function() {$(Screw).dequeue()}, 0);
        }

        function runJob(job, remainingJobs) {
          try {
            job();
            if(remainingJobs.length > 0) {
              runAsyncJobs(remainingJobs);
            } else {
              trigger('passed')
            }
          } catch(e) {
            trigger('failed', [e]);
          }
        }

        function runWaitFor(waitForJob, timeWaited, remainingJobs) {
          window.setTimeout(function() {
            if(waitForJob()) {
              runAsyncJobs(remainingJobs);
            } else if(timeWaited < waitForJob.timeout) {
              runWaitFor(waitForJob, timeWaited + 250, remainingJobs);
            } else {
              trigger('failed', [waitForJob.description]);
            }
          }, 250);
        }

        function runAsyncJobs(asyncJobs) {
          if(asyncJobs.length > 0) {
            var nextJob = asyncJobs[0];
            var remainingJobs = asyncJobs.slice(1);

            if(nextJob.type === "waitFor") {
              runWaitFor(nextJob, 0, remainingJobs);
            } else {
              runJob(nextJob, remainingJobs);
            }
          }
        }

        $(this).fn('parent').fn('run_befores');
        if($(this).data('screwunit.run')) {
          runJob($(this).data('screwunit.run'), []);
        } else {
          runAsyncJobs($(this).data('screwunit.asyncJobs'));
        }
      },

      enqueue: function() {
        var self = $(this).trigger('enqueued');
        $(Screw)
          .queue(function() {
            self.fn('run');
          });
      },

      selector: function() {
        return $(this).fn('parent').fn('selector')
          + ' > .its > .it:eq(' + $(this).parent('.its').children('.it').index(this) + ')';
      }
    });
    
    $('.before').fn({
      run: function() { $(this).data('screwunit.run')() }
    }); 
  
    $('.after').fn({
      run: function() { $(this).data('screwunit.run')() }
    });

    $(Screw).trigger('before');
    var to_run = unescape(location.search.slice(1)) || 'body > .describe > .describes > .describe';
    $(to_run)
      .focus()
      .eq(0).trigger('scroll').end()
      .fn('enqueue');
    $(Screw).queue(function() { $(Screw).trigger('after') });
  })
})(jQuery);

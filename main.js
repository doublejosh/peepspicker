/**
 * Peeps Picker 9000 Pro
 * 0.0.1
 */
(function($, _) {

  var favSkillsMulti = 1,
      intSkillsMulti = 0.5,
      randomizer = false,
      //urlPrefix = 'mock-data/',
      urlPrefix = '//api.github.com/gists/',
      examples = [
        '8cb86c13726d5339146e',
        'd33a2de82eb74f56c183',
        'b98d83907abdda33a7be'
      ];


  /**
   * Show chosen few.
   *
   * @param {array} peeps
   *   People chosen for group.
   */
  function showPeeps(peeps) {
    $.get('skills.yml', function(data) {
      var json = [],
          skillPartial = $('#template-listskill').html(),
          skill,
          emails = [];

      _.mapObject(jsyaml.load(data), function(val, key) {
        json.push({sid: key, name: val});
      });

      // Loop through people and their skills.
      for (var p in peeps) {
        for (var s in peeps[p].favSkills) {
          skill = false;
          skill = _.find(json, function(_skill) {
            return (_skill.sid === peeps[p].favSkills[s]);
          });
          if (skill !== undefined) peeps[p].favSkills[s] = skill.name;
          else peeps[p].favSkills[s] = 'MISSING SKILL';
        }

        for (s in peeps[p].intSkills) {
          skill = false;
          skill = _.find(json, function(_skill) {
            return (_skill.sid === peeps[p].intSkills[s]);
          });
          if (skill !== undefined) peeps[p].intSkills[s] = skill.name;
          else peeps[p].intSkills[s] = 'MISSING SKILL';
        }

        emails.push(peeps[p].email);
      }

      // Render nested.
      $('#peeps-list ul').html(
        Mustache.to_html(
          $('#template-peeps').html(),
          {peeps: peeps},
          {skill: skillPartial}
        )
      );

      $('#peeps-message input[name="receipients"]').val(emails.join(', '));
    });
  }


  /**
   * Build the form from configs.
   */
  function buildForm() {
    $.get('skills.yml', function(data) {
      var json = [];

      _.mapObject(jsyaml.load(data), function(val, key) {
        json.push({sid: key, name: val});
      });

      $('#skills').html(
        Mustache.render($('#template-skills').html(), {skills: json})
      ).parents('form').garlic();
    });
  }


  /**
   * Turn match numbers into charts.
   */
  // function makeCharts() {
  //   $.each('.peeps-list__chance', function() {
  //     var svg = d3.select(this).append("svg"),
  //         t = textures.lines().heavier(this.chance * 10);

  //     svg.call(t);
  //     svg.append("circle").style("fill", t.url());
  //   });
  // }


  // Grab peoples' interests from GitHub gists.
  function getPeople(gids) {
    var deferredList = [],
        deferred = new $.Deferred(),
        people = [];

    // Get gist API data and transform.
    function grabGist(gid) {
      return $.getJSON(urlPrefix + gid, function(json) {
        var yaml = json.files[_.keys(json.files)[0]].content;
            person = jsyaml.load(yaml);

        person.username = json.owner.login;
        if (!person.hasOwnProperty('name')) {
          person.name = json.owner.login;
        }
        people.push(person);
      });
    }

    // Examples.
    if (typeof gids !== 'object' || !gids.length) gids = examples;

    // Collect gist content.
    for (var g in gids) {
      deferredList.push(grabGist(gids[g]));
    }

    $.when.apply($, deferredList).done(function() {
      peopleStatic = people;
      deferred.resolve(people);
    });

    return deferred;
  }


  /**
   * Use form data to choose people.
   *
   * @param  {object} data
   *   Form data.
   * @return {array}
   *   People chosen for group.
   */
  function processData() {
    var maxMatch = 0,
        deferred = new $.Deferred(),
        deferredList = [],
        sortedPeeps,
        data = collectData();

    /**
     * Grab the data from the form.
     *
     * @return {object}
     */
    function collectData() {
      var data = {
            skills: [],
            randomizer: []
          },
          gids;

      $("#peeps-picker input, #peeps-picker select").each(function() {
        var type = $(this).attr('type') || $(this).prop('tagName'),
            elmName = $(this).attr('name');

        switch(type) {
          case 'text':
          case 'TEXTAREA':
          case 'SELECT':
            data[elmName] = $(this).val();
            break;

          case 'checkbox':
          case 'radio':
            if ($(this).prop('checked')) {
              data[$(this).attr('name')].push($(this).val());
            }
            break;
        }
      });

      return data;
    }

    /**
     * Allow for matching before sorting/pruning.
     * @param {object} peep
     * @return {Deferred}
     */
    function checkMatch(peep) {
      var match = 0,
          def = new $.Deferred();

      // Find match score.
      peep.favSkills = _.intersection(peep.favSkills, data.skills);
      match += favSkillsMulti * peep.favSkills.length;
      peep.intSkills = _.intersection(peep.intSkills, data.skills);
      match += intSkillsMulti * peep.intSkills.length;
      _.extend(peep, {match: match});

      // Store max.
      maxMatch = (match > maxMatch) ? match : maxMatch;

      def.resolve();
      return def;
    }


    // Load up the people.
    gids = data.people.split(/[ ,]+/);
    $.when(getPeople(gids)).then(function (peeps) {

      // Gather and compute match.
      $.each(peeps, function() {
        deferredList.push(checkMatch(this));
      });

      // Compute change and pick.
      $.when.apply($, deferredList).then(function() {
        $.each(peeps, function(i, peep) {
          var chance = peep.match / maxMatch;

          // Add some chance if desired.
          if (parseInt(data.randomizer) === 1) {
            chance = Math.random() * chance;
          }

          chance = Math.round(chance * 100) / 100 || 0;
          this.chance = String(chance);
        });

        // Sort matches and send back.
        sortedPeeps = _.sortBy(peeps, 'chance').reverse();

        // @todo Always randomize among equal values.
        deferred.resolve(sortedPeeps.slice(0, data.number));
      });
    });

    return deferred;
  }


  // Load that page!
  $(window).load(function() {
    var $form = $('#peeps-picker form'),
        stashedPeeps = $form.find('#people').val();

    buildForm();
    $('#peeps-message').hide();

    // Use garlic saved peeps.
    gids = (stashedPeeps) ? stashedPeeps.split(/[ ,]+/) : [];
    $.when(getPeople(gids)).then(function(peeps) {
      showPeeps(peeps.sort(function() {
        return (Math.round(Math.random()) - 0.5);
      }));
    });

    // Match form.
    $form.on('submit', function (e) {
      $.when(processData()).then(function(data) {
        showPeeps(data);
        $('#peeps-message').show();

        //makeCharts();
      });
      $(this).addClass('isCollapsed');
      e.preventDefault();
    });
    $form.on('click', function () {
      if ($form.hasClass('isCollapsed')) $form.toggleClass('isCollapsed');
    });
    $('#peeps-picker__opener').on('click', function(e) {
      e.preventDefault();
    });

    // Reset.
    $form.on('reset', function () {
      $(this).find('input:checkbox').removeAttr('checked');
      $(this).garlic('destroy');
      $('#peeps-message').hide();
    });

    // Message form.
    $('#peeps-message form').on('submit', function (e) {
      var emails = $(this).find('input[name="receipients"]').val(),
          skills = [],
          body;

      $('#skills .peeps-picker__checkbox-label').each(function() {
        if ($(this).siblings('input').prop('checked')) {
          skills.push($(this).text());
        }
      });
      window.open('mailto:' + emails + '?subject=New%20Project&body=%0D%0A%0D%0A%0D%0ARequirements: ' + skills.join(', '), 'messageWindow');
      e.preventDefault();
    });

  });

})(jQuery, _);

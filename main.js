/**
 * Peeps Picker 9000 Pro
 * 0.1.0
 */
(function($, _) {

  var favSkillsMulti = 1,
      intSkillsMulti = 0.5,
      randomizer = false,
      //urlPrefix = 'mock-data/',
      urlPrefix = '//api.github.com/gists/',
      exampleSkills = '158c42f68ebd2f6bf628',
      //exampleCustomer = 'db256772cdcde68ad042',
      exampleProfiles = [
        '8cb86c13726d5339146e',
        'd33a2de82eb74f56c183',
        'b98d83907abdda33a7be'
      ],
      templates = {
        peep: $('#template-peeps').html(),
        skillForm: $('#template-skills').html(),
        skillList: $('#template-listskill').html()
      },
      $pickerForm = $('#peeps-picker form');


  /**
   * Utility: YAML gist grabber.
   *
   * @param {string} gid
   * @return {array}
   *   List of objects
   */
  function getGistYAML(gid) {
    var deferred = $.Deferred();

    $.getJSON(urlPrefix + gid, function(data) {
      var yaml = data.files[_.keys(data.files)[0]].content,
          list = [];

      _.mapObject(jsyaml.load(yaml), function(val, key) {
        list.push({key: key, value: val});
      });

      deferred.resolve(list);
    });
    return deferred;
  }


  /**
   * Utility: Get URL parameter.
   *
   * @param {string} param
   * @return {string}
   */
  function getUrlParam(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName;

    for (var i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] == sParam) {
        return sParameterName[1];
      }
    }
    return false;
  }


  /**
   * Build the form from configs.
   */
  function init() {
    var skillsGid = grabSkills(),
        peepGids = grabPeeps();

    // Compile all templates.
    for (var t in templates) Mustache.parse(t);

    // Handle people.
    $.when(getPeople(peepGids)).then(function(peeps) {
      showPeeps(peeps.sort(function() {
        return (Math.round(Math.random()) - 0.5);
      }));
    });

    // Handle skills.
    $.when(getGistYAML(skillsGid)).then(function (data) {
      $('#skills').html(
        Mustache.render(templates.skillForm, {skills: data})
      ).parents('form').garlic();
    });
  }


  /**
   * Get people list form wherever is appropriate.
   *
   * @param {boolean} returnString
   * @return {array|string}
   */
  function grabPeeps(returnString) {
    var urlPeeps = getUrlParam('peeps') || '';
        peeps = $pickerForm.find('#people').val() || urlPeeps.replace('/','');

    $pickerForm.find('#people').val(peeps);

    if (peeps) {
      return (returnString === undefined) ? peeps.split(/[ ,]+/) : peeps;
    }
    else {
      return exampleProfiles;
    }
  }


  /**
   * Get people list form wherever is appropriate.
   *
   * @return {array}
   */
  function grabSkills() {
    var urlSkills = getUrlParam('skills') || '';
        skills = $pickerForm.find('#skills-source').val() || urlSkills.replace('/','');

    $pickerForm.find('#skills-source').val(skills);

    return skills || exampleSkills;
  }


  /**
   * Create a quick link to this set of data.
   *
   * @param {array} data
   */
  function createQuickLink(data) {
    var params = {
      peeps: data.hasOwnProperty('people') ? data.people.join() : '',
      skills: data.hasOwnProperty('skills') ? data.skills.join() : ''
    };

    $('.peeps-picker__quick-link').remove();
    $('#peeps-picker form').append(
      $('<h3>', {class: 'peeps-picker__quick-link'}).append(
        $('<a>', {
          html: 'Quick link to this data',
          href: window.location + '?' + decodeURIComponent($.param(params)),
    })));
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


  /**
   * Grab profile from GitHub gists.
   *
   * @param  {array} gids
   * @return {Deferred}
   *   Resolves with an array of people objects.
   */
  function getPeople(gids) {
    var deferredList = [],
        deferred = new $.Deferred(),
        people = [];

    // Get gist API data and transform.
    function grabGistYAMLprofile(gid) {
      return $.getJSON(urlPrefix + gid, function(data) {
        var yaml = data.files[_.keys(data.files)[0]].content;
            person = jsyaml.load(yaml);

        person.username = data.owner.login;
        if (!person.hasOwnProperty('name')) {
          person.name = data.owner.login;
        }
        people.push(person);
      });
    }

    // Examples.
    if (typeof gids !== 'object' || gids.length === 0) gids = exampleProfiles;

    // Collect gist content.
    for (var g in gids) {
      deferredList.push(grabGistYAMLprofile(gids[g]));
    }

    $.when.apply($, deferredList).done(function() {
      peopleStatic = people;
      deferred.resolve(people);
    });

    return deferred;
  }


  /**
   * Show chosen few.
   *
   * @param {array} peeps
   *   People chosen for group.
   */
  function showPeeps(peeps) {
    var skillsGid = grabSkills();

    $.when(getGistYAML(skillsGid)).then(function (data) {
      var skill,
          emails = [],
          key;

      // Loop through people and their skills.
      for (var p in peeps) {
        for (var s in peeps[p].favSkills) {
          key = peeps[p].favSkills[s];
          skill = false;

          skill = _.find(data, function(_skill) {
            return (_skill.key === key);
          });
          if (skill !== undefined) {
            peeps[p].favSkills[s] = {key: key, value: skill.value};
          }
          else {
            peeps[p].favSkills[s] = {key: key, value: 'MISSING:(' + key + ')'};
          }
        }

        for (s in peeps[p].intSkills) {
          key = peeps[p].intSkills[s];
          skill = false;

          skill = _.find(data, function(_skill) {
            return (_skill.key === key);
          });
          if (skill !== undefined) {
            peeps[p].intSkills[s] = {key: key, value: skill.value};
          }
          else {
            peeps[p].intSkills[s] = {key: key, value: 'MISSING:(' + key + ')'};
          }
        }

        emails.push(peeps[p].email);
      }

      // Render nested.
      $('#peeps-list ul').html(
        Mustache.to_html(templates.peep, {peeps: peeps}, {skill: templates.skillList})
      );

      $('#peeps-message input[name="receipients"]').val(emails.join(', '));
    });
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
          case 'range':
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
    gids = (data.people) ? data.people.split(/[ ,]+/) : exampleProfiles;
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
          // Compute.
          this.chance = String(Math.round(chance * 100) / 100 || 0);
        });

        // Sort matches and send back.
        sortedPeeps = _.sortBy(peeps, 'chance').reverse();

console.log(data);

        deferred.resolve(sortedPeeps.slice(0, data.size));
      });
    });

    return deferred;
  }


  // Load that page!
  $(window).load(function() {
    init();
    $('#peeps-message').hide();

    // Match form.
    $pickerForm.on('submit', function (e) {
      $.when(processData()).then(function(data) {
        showPeeps(data);
        $('#peeps-message').show();

        createQuickLink(data);
        //makeCharts();
      });
      $(this).addClass('isCollapsed');
      e.preventDefault();
    });
    $pickerForm.on('click', function () {
      if ($pickerForm.hasClass('isCollapsed')) $pickerForm.toggleClass('isCollapsed');
    });
    $('#peeps-picker__opener').on('click', function(e) {
      e.preventDefault();
    });

    // Size.
    $('#peeps-picker-size').on('input change', function() {
      var toolTips = {
        1: 'Just <strong>One</strong>',
        2: 'Tidy <strong>Pair</strong>',
        3: '<strong>Tr&egrave;s</strong> Amigos',
        4: '<strong>Four</strong> Horsemen',
        5: '<strong>Five</strong> Wizards',
        6: 'Seriously <strong>Six!</strong>',
        7: '<strong>7777777</strong>',
        8: 'Qua? <strong>Eight</strong>'
      };
      $('.peeps-picker__size .peeps-picker__desc').html(toolTips[$(this).val()]);
    });

    // Reset.
    $pickerForm.on('reset', function () {
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

/**
 * Peeps Picker 9000 Pro
 * 0.0.1
 */
(function($, _) {

  var favSkilsMulti = 1,
      intSkillsMulti = 0.5,
      randomizer = false;


  /**
   * Show chosen few.
   *
   * @param {array} peeps
   *   People chosen for group.
   */
  function showPeeps(peeps) {

    $.getJSON('skills.json', function(json) {
      var skillPartial = $('#template-listskill').html(),
          skill;

      // Loop through people and their skills.
      for (p in peeps) {
        for (s in peeps[p].favSkills) {
          skill;
          skill = _.find(json, function(_skill) {
            return (_skill.sid === parseInt(peeps[p].favSkills[s]));
          });
          if (skill !== undefined) peeps[p].favSkills[s] = skill.name;
          else peeps[p].favSkills[s] = 'MISSING SKILL';
        }

        for (s in peeps[p].intSkills) {
          skill;
          skill = _.find(json, function(_skill) {
            return _skill.sid === parseInt(peeps[p].intSkills[s]);
          });
          if (skill !== undefined) peeps[p].intSkills[s] = skill.name;
          else peeps[p].intSkills[s] = 'MISSING SKILL';
        }
      }


      // Render nested.
      $('#peeps-list').html(
        Mustache.to_html(
          $('#template-peeps').html(),
          {peeps: peeps},
          {skill: skillPartial}
        )
      );

    });
  }


  /**
   * Build the form from configs.
   */
  function buildForm() {
    $.getJSON('skills.json', function(json) {
      $('#skills').html(
        Mustache.render($('#template-skills').html(), {skills: json})
      );
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
      var data = {skills: []};

      $("#peeps-picker input, #peeps-picker select").each(function() {
        var type = $(this).attr('type') || $(this).prop('tagName');

        switch(type) {
          case 'text':
          case 'TEXTAREA':
          case 'SELECT':
            data[$(this).attr('name')] = $(this).val();
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
      match += favSkilsMulti * _.intersection(peep.favSkills, data.skills).length;
      match += intSkillsMulti * _.intersection(peep.intSkills, data.skills).length;
      _.extend(peep, {match: match});

      // Store max.
      maxMatch = (match > maxMatch) ? match : maxMatch;

      def.resolve();
      return def;
    }

    $.getJSON('peeps.json', function(peeps) {

      // Gather and compute match.
      $.each(peeps, function() {
        deferredList.push(checkMatch(this));
      });

      // Compute change and pick.
      $.when.apply(this, deferredList).done(function() {
        $.each(peeps, function(i, peep) {
          var chance = peep.match / maxMatch;

          // Add some chance if desired.
          if (randomizer === true) {
            chance = Math.random() * chance;
          }
          this.chance = chance || 0;
        });

        // Sort matches and send back.
        sortedPeeps = _.sortBy(peeps, 'chance').reverse();
        deferred.resolve(sortedPeeps.slice(0, data.number));
      });
    });

    return deferred;
  }


  $(document).ready(function() {
    var $form = $('#peeps-picker form');

    buildForm();

    $.getJSON('peeps.json', function(json) {
      showPeeps(json);
    });

    // Bind form.
    $form.on('submit', function (e) {
      $.when(processData()).done(function(data) {
        showPeeps(data);
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

  });

})(jQuery, _);

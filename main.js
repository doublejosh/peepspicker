/**
 * Peeps Picker 9000 Pro
 * 0.0.1
 */
(function($, _) {

  var favSkillsMulti = 1,
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
      $('#peeps-list ul').html(
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
      var data = {
            skills: [],
            randomizer: []
          };

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

console.log('REQUESTED...');
console.log(data.skills);

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

console.log('Skills...');
console.log(peep.favSkills);
console.log(peep.intSkills);
console.log('Match: ' + match);

      // Store max.
      maxMatch = (match > maxMatch) ? match : maxMatch;

      def.resolve();
      return def;
    }


    // Load up the people.
    $.getJSON('peeps.json', function(peeps) {

      // Gather and compute match.
      $.each(peeps, function() {
        deferredList.push(checkMatch(this));
      });

      // Compute change and pick.
      $.when.apply(this, deferredList).done(function() {

console.log('Max : ' + maxMatch);

        $.each(peeps, function(i, peep) {
          var chance = peep.match / maxMatch;

console.log('- - - - - - - - - - - - - - -');
console.log('Name : ' + peep.name);
console.log('Match : ' + peep.match);
console.log('Chance : ' + chance);

          // Add some chance if desired.
          if (parseInt(data.randomizer) === 1) {
            chance = Math.random() * chance;
          }

console.log('AFTER Chance : ' + chance);

          chance = Math.round(chance * 100) / 100 || 0;
          this.chance = String(chance);
console.log(this);
        });

console.log('- - - - - - - - - - - - - - -');
console.log(peeps);

        // Sort matches and send back.
        sortedPeeps = _.sortBy(peeps, 'chance').reverse();

console.log('- - - - - - - - - - - - - - -');
console.log(sortedPeeps);

        // @todo Always randomize among equal values.
        deferred.resolve(sortedPeeps.slice(0, data.number));
      });
    });

    return deferred;
  }


  // Load that page!
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
    $('#peeps-picker__opener').on('click', function(e) { e.preventDefault() });

  });

})(jQuery, _);

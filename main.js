/**
 * Peeps Picker 9000 Pro
 * 0.0.1
 */
(function($, _) {

  var favSkilsMulti = 1,
      intSkillsMulti = 0.5,
      randomizer = true,
      threshold = 0.2;
      peeps,
      data;

  /**
   * Display a list people.
   */
  function showPeeps() {
    $.getJSON('/peeps.json', function(data) {
      data.each(function() {
        peeps.push(this);
        $('li', {
          text: this.name + ' (' + this.skills + ')';
        }).appendTo('#peeps-list');
      });
    });
  }


  /**
   * Show chosen few.
   *
   * @param {array} results
   *   People chosen for group.
   */
  function report(results) {
    results.each(function() {
      $('li', {
        text: this.name + ' (' + this.match + ')';
      }).appendTo('#peeps-list');
    })
  }


  /**
   * Use form data to choose people.
   *
   * @param  {object} data
   *   Form data.
   * @return {array}
   *   People chosen for group.
   */
  function processData(data) {
    var maxMatch;

    // Gather and compute match.
    peeps.each(function() {
      var match = 0;

      // Match score.
      match += favSkilsMulti * (_.intersection(this.favSkills, data.skills));
      match += intSkillsMulti * (_.intersection(this.interestSkills, data.skills));
      _.extend(this, {match: match});
      // Store max.
      matchMax = (match > matchMax) ? matchMax : match;
    });

    // Compute chance.
    $.each(peeps, function(i, peep) {
      var chance = peep.match / maxMatch;

      if (peep.match < threshold) {
        peeps.splice(i, 1);
        return;
      }

      // Add some chance if desired.
      if (randomizer === true) {
        Math.random() * chance;
      }
      this.chance = chance;
    });

    // Find the people.
    _.sortBy(peeps, 'chance');

    return peeps.slice(0, data.number);
  }


  /**
   * Grab the data from the form.
   *
   * @return {object}
   */
  function collectData() {
    $("form#folks input, form#folks select").each(function() {
      switch($(this).attr('id')) {
        case: 'text'
        case: 'textarea'
        case: 'select'
          data[$(this).attr('name')] = $(this).val();
          break;

        case: 'checkbox'
        case: 'radio'
          data[$(this).attr('name')] = $(this).val()
          break;
      }
    });

    return data;
  }


  $(document).ready(function() {
    // Add people for reference.
    showPeeps();
    // Bind form.
    $('form#folks').submit(function (e) {
      report(processData(collectData()));
      e.preventDefault();
    });
  });

})(jQuery, _);

Peeps Picker Pro 9000!
======================

**Hyper-agile rapid-scrum synergy-acracy engine**

Peeps could work on everything, this helps you pick when.  No matter your process, you have new projects and people who will need to work on them.  Easily find evenyone's best matches, everytime!

## [Demo](http://doublejosh.github.io/peepspicker)
If you just want a quick demo, the tool will fill in fake data.  Pick a number of helpers and a few required skills for the project. Click "whom" and you'll get matched results and provide a quick email starter.

## Use Your Data
To use this tool with your group, you'll need to create several [gists](https://gist.github.com) to represent your data.

First you need a skills master list (YAML),  [see example](https://gist.github.com/doublejosh/158c42f68ebd2f6bf628).
```yaml
---
js: JavaScript
css: CSS/SASS
php: PHP
i18n: Internationalization
api: APIs
drupal: Drupal
tests: Automated testing
```

Next each participant will need to create a gist representing their skillset (YAML), this includes both favorite skills and interest skills.  Peeps' `favSkills` have a higher match multiplier than their `intSkills`.  See examples gists: [#1](https://gist.github.com/doublejosh/8cb86c13726d5339146e), [#2](https://gist.github.com/doublejosh/d33a2de82eb74f56c183), [#3](https://gist.github.com/doublejosh/b98d83907abdda33a7be).
```yaml
---
name: Captain Interesting
email: captain@example.com
favSkills:
  - tests
  - php
intSkills:
  - js
  - api
  - ux
```

#### Now your team can use the [Peeps Picker Pro 9000!](http://doublejosh.github.io/peepspicker/)

## Pick Peeps
Visit the peeps picker. NOTE: Form values are stashed in your browser for next time.

1. Enter your list of team member gist IDs.
2. Enter your skills gist ID.
3. Pick a numner of people.
4. Pick required skills.

Generate a project team.  It will even start a quick email for you.

## Quick Link
You can rely on browser storage to keep the form populated with your group's data, but you can also use a quick link to allow easily sharing this tool.  Great for managers, new people, etc.  This uses query params like this `?skills=GID&people=GID,GID,GID` to set form values.

## Todo
- Adjustable match multipliers.
- Make "customer" a match factor.
- Only reach out to API on page load or form change.
- Optionally just use peeps Gists for skills list.

## Development
To develop offline, without bumping into API limits, stash the GitHub API JSON responses in the `mock-data` folder with a file name of the gist ID.  Find such data at a url like...
`https://api.github.com/gists/8cb86c13726d5339146e`

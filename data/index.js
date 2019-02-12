'use strict';

const knowledges = require('./abilities/knowledges.json');
const skills = require('./abilities/skills.json');
const talents = require('./abilities/talents.json');
const backgrounds = require('./advantages/backgrounds.json');
const numina = require('./advantages/numina.json');
const virtues = require('./advantages/virtues.json');
const mental = require('./attributes/mental.json');
const physical = require('./attributes/physical.json');
const social = require('./attributes/social.json');
const nature = require('./basic/nature.json');
const knowledgesSec = require('./secondary/knowledges.json');
const skillsSec = require('./secondary/skills.json');
const talentsSec = require('./secondary/talents.json');
const flaws = require('./flaws.json');
const mock = require('./mock.json');
const merits = require('./merits.json');

module.exports = {
  knowledges,
  skills,
  talents,
  backgrounds,
  numina,
  virtues,
  mental,
  physical,
  social,
  nature,
  mock,
  demeanor: nature,
  secondary: {knowledges: knowledgesSec, skills: skillsSec, talents: talentsSec},
  flaws,
  merits,
};

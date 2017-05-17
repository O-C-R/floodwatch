// @flow

const categories = require('../../stubbed_data/topic_keys.json');

export const COLORS_BY_NAME = {
  'Beauty / Personal Care': ['#ffdc18', '#ffec18'],
  NGO: ['#7e14c1', '#a93eec'],
  Health: ['#f30072', '#ff278c'],
  Social: ['#fd8a0e', '#fda60e'],
  'Retailers / General Merchandise': ['#ffc618', '#ffdc18'],
  Sports: ['#036de4', '#11a3f7'],
  Spam: ['#576970', '#708e9a'],
  'Food / Beverages': ['#08c5fb', '#08e7fb'],
  'Magazine / Book / News': ['#0035ce', '#036de4'],
  'Jobs / Education': ['#31bd0c', '#59d914'],
  'Home / Garden': ['#06cfba', '#0bf7d3'],
  'Business Event': ['#59d914', '#84f516'],
  Travel: ['#11a3f7', '#08c5fb'],
  Political: ['#5604a3', '#7e14c1'],
  Entertainment: ['#001595', '#0035ce'],
  Financial: ['#0f9b00', '#31bd0c'],
  Unknown: ['#89a4af', '#9cb5bf'],
  XXX: ['#FFF', '#000'],
  'Tech / Electronics': ['#fd730e', '#fd8a0e'],
  Automotive: ['#c80018', '#f12b42'],
  Apparel: ['#ffae00', '#ffc618'],
  'Development / Design / Web-Services': ['#ff5a00', '#fd730e'],
  Other: ['#89a4af', '#9cb5bf'],
};

const allColors = { ...COLORS_BY_NAME };
for (const categoryId in categories) {
  const categoryName = categories[categoryId];
  allColors[categoryId] = COLORS_BY_NAME[categoryName];
}

export default allColors;

//This script takes a CSV file fo energy consumption
//and a geojson file of EU countires
//and mreges the files together
//it also aggregates some energy sources together
//and removes unessecary data

var fs = require('fs')
var parse = require('csv-parse/lib/sync');

var fileName = 'energyConsumption';
var csv = fs.readFileSync('./' + fileName + '.csv', 'utf8')


var records = parse(csv, {columns: true});

var out = {};

for(var r in records){
    var row = records[r]

    var country = row.GEO;
    //add country if nessecary
    if(out[country] == null){
        out[country] = {}
    }


    var year = row.TIME;
    //add year if nessecary
    if(out[country][year] == null){
        out[country][year] = {}
    }

    var energyType = row.PRODUCT;

    var renamed = renameType(energyType);

    if(renamed == "delete") continue;

    var value = parseFloat(trim(row.Value));
    if (isNaN(value)) {value = 0;}
    if(value < 0) value = 0;

    if(out[country][year][renamed] == null) {
        out[country][year][renamed] = 0;
    }

    out[country][year][renamed] += value


}




function trim(s){
  return ( s || '' ).replace(/\s/g,'');
}


function renameType(type){
    var result = type;

    switch(type){
        case "Anthracite":
        case "Patent Fuels":
        case "Coking Coal":
        case "Other Bituminous Coal":
        case 'Sub-bituminous Coal':
        case 'Coke Oven Coke':
        case 'Gas Coke':
        case 'Coal Tar':
        case 'Lignite/Brown Coal':
        case 'BKB (brown coal briquettes)':
        case 'Peat':
        case 'Peat products':
        case 'Oil shale and oil sands':
            return "delete"

        case 'Crude oil (without NGL)':
        case 'Natural gas liquids (NGL)':
        case 'Refinery feedstocks':
        case 'Additives/Oxygenates':
        case 'Other hydrocarbons':
        case 'Refinery gas':
        case 'Ethane':
        case 'Liquified petroleum gas (LPG)':
        case 'Gasoline (without bio components)':
        case 'Aviation gasoline':
        case 'Other kerosene':
        case 'Gasoline type jet fuel':
        case 'Kerosene type jet fuel (without bio components)':
        case 'Naphtha':
        case 'Gas/diesel oil (without bio components)':
        case 'Total fuel oil':
        case 'White Spirit and SBP':
        case 'Lubricants':
        case 'Bitumen':
        case 'Petroleum coke':
        case 'Paraffin Waxes':
        case 'Other Oil Products':
            return "delete"


        case 'Natural gas':
        case 'Coke Oven Gas':
        case 'Blast Furnace Gas':
        case 'Gas Works Gas':
        case 'Other recovered gases':
            return "delete"

        case 'Electrical energy':
            return "Imports"


        case "Municipal waste":
            return "delete"


        case "Total petroleum products":
            return "Petroleum Products"

        case 'Derived Heat':
        case 'Municipal waste (non-renewable)':
        case 'Waste (non-renewable)':
        case 'Industrial wastes':
        case 'Derived heat':
            return "Other non-renewable"


        case 'Biogasoline':
        case 'Biodiesels':
        case 'Other liquid biofuels':
        case 'Bio jet kerosene':
        case 'Biogas':
        case 'Solid biofuels (excluding charcoal)':
            return "Biofuels"

        case "Municipal waste (renewable)":
        case "Tide, Wave and Ocean":
        case "Charcoal":
            return "Other Renewable"


        case 'Solar thermal':
        case "Solar photovoltaic":
            return "Solar"

        default:
            return type;

    }
}




function mapCountryNames(name){
    switch(name){
        case "Germany":
            return "Germany (until 1990 former territory of the FRG)";
        case "Kosovo":
            return "Kosovo (under United Nations Security Council Resolution 1244/99)";
        case "Macedonia":
            return "Former Yugoslav Republic of Macedonia, the";
        case "European Union":
            return "European Union (28 countries)"
        default:
            return name;
    }
}

var geoData = fs.readFileSync('./eu.geojson', 'utf8');

var geo = JSON.parse(geoData);

for(var i=0; i<geo.features.length; i++){
    var countryName = geo.features[i].properties.NAME_LONG;
    if(out[mapCountryNames(countryName)] != null){
      geo.features[i].name = countryName;
      geo.features[i].energy = out[mapCountryNames(countryName)];
      //console.log("got stats for " + countryName)
    }else{
      geo.features[i].energy = {};
      geo.features[i].name = countryName;
      console.log("No stats for " + countryName);
    }
  }

var eu = 'European Union';

geo.features[i] = {
  energy : out[mapCountryNames('European Union')],
  name : 'European Union'
}

//console.log(geo)

fs.writeFile(fileName + "_out.json", JSON.stringify(geo), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});










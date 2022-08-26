import fs from 'fs'

function saveToFile(obj: Object, name: string) {
    var jsonContent = JSON.stringify(obj, null, 2);
    // console.log(jsonContent);
    
    fs.writeFile(name, jsonContent, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
    
        console.log("JSON file has been saved.");
    });
  }

export {
    saveToFile
}
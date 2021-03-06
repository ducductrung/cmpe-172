#!/usr/bin/env node

// Module for PatternMatch
var Transform = require('stream').Transform;
var util = require("util");

// For Node 0.8 users
if (!Transform) {
    Transform = require('readable-stream/transform');
}

function PatternMatch(pattern) {
    // If not invokked with "new", then return the newable instance
      if ( ! ( this instanceof PatternMatch ) ) {
	          return( new PatternMatch( pattern ) );
	    }
      
      this.pattern = pattern;
      
      //ObjectMode is on so when stream reads sensor data it emits single pattern match.
      Transform.call( this,
		        {
			        objectMode: true
			      } );
}

//Extend the Transform class.
//--
//NOTE: This only extends the class methods - not the internal properties. As such we // have to make sure to call the Transform constructor(above).
util.inherits(PatternMatch, Transform);

//Implements _transform
PatternMatch.prototype._transform = function(chunk, encoding, getNextChunk) {
    var data = chunk.toString()
    if (this._lastChunk) data = this._lastChunk + data;

    var content = data.split(this.pattern);
    this._lastChunk = content.splice(content.length - 1, 1)[0]

    content.forEach(this.push.bind(this))
    getNextChunk();
}

PatternMatch.prototype._flush = function(flushCompleted) {
    if (this._lastChunk) this.push(this._lastChunk)
    this._lastChunk = null;
    flushCompleted();
}
// End of patternMatch module

// Program module
var program = require("commander"); 
var fileSystem = require("fs");

//Program module to take command line arguments
program
       .option('-p, --pattern <pattern>', 'Input Pattern such as . ,')

       .parse(process.argv);

// Input stream from the file system.
var inputStream = fileSystem.createReadStream( "input-sensor.txt" );

//Print input to console
console.log("\n########################### Input ##########################");
inputStream.pipe(process.stdout);

// Run through the input and find pattern matches.
var patternStream = inputStream.pipe( new PatternMatch(program.pattern));

// Read matches from the stream.
var matches = [];

patternStream.on("readable", function() {
   
    var content = null;

    while ( content = this.read()){
      matches.push(content);
    }
  }
);

//Print output
patternStream.on("end", function() {
    console.log("\n########################### Output ##########################");
    console.log(matches);
}
);

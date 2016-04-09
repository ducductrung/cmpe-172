/**
 * Duc Nguyen
 */
var fs = require( "fs" );
var stream = require( "stream" );
var util = require( "util" );
var chalk = require( "chalk" );

//Transform stream (writable/readable) that takes input and finds matches to the
// given regular expression. Push each match onto the output stream individually.
function RegExStream( p ) {

	if ( ! ( this instanceof RegExStream ) ) {
		return( new RegExStream( p ) );
	}

	// Call super-constructor. Set objectMode.
	stream.Transform.call(
		this,
		{
			objectMode: true
		}
	);

	// Check if pattern is instance of 
	if ( ! ( p instanceof RegExp ) ) {
		p = new RegExp( p, "g" );
	}

	// Clone pattern locally
	this._pattern = this._clonePattern( p );

	// Hold unprocessed stuff
	this._inputBuffer = "";
}

// Extend the Transform
util.inherits( RegExStream, stream.Transform );

// Clone regular expression instance
RegExStream.prototype._clonePattern = function( p ) {

	// Split the pattern
	var parts = p.toString().slice( 1 ).split( "/" );
	var regex = parts[ 0 ];
	var flags = ( parts[ 1 ] || "g" );

	if ( flags.indexOf( "g" ) === -1 ) {
		flags += "g";
	}
	return( new RegExp( regex, flags ) );
};

// Finalize the internal state when the write stream finish writing
RegExStream.prototype._flush = function( flushCompleted ) {
	logInput( "\n >>>> Output:", this._inputBuffer );

	var match = null;

	// Loop over any remaining matches
	while ( ( match = this._pattern.exec( this._inputBuffer ) ) !== null ) {
		logInput( "Push( _flush ):", match[ 0 ] );
		this.push( match[ 0 ] );
	}

	// Clean internal buffer
	this._inputBuffer = "";

	// End of input stream
	this.push( null );

	// Input processing completed
	flushCompleted();

};


// Transform input chunk into output chunks.
RegExStream.prototype._transform = function( chunk, encoding, getNextChunk ) {

	logInput( ">>> Input:\n", chunk.toString( "utf8" ) );

	// Add chunk to internal buffer
	this._inputBuffer += chunk.toString( "utf8" );

	//Pointer
	var nextOS = null;

	var match = null;

	// Loop over the matches on buffered input
	while ( ( match = this._pattern.exec( this._inputBuffer ) ) !== null ) {

		// If current match is within the bounds push match into the output.
		if ( this._pattern.lastIndex < this._inputBuffer.length ) {
			logInput( "Push:", match[ 0 ] );
			this.push( match[ 0 ] );

			// Set pointer
			nextOS = this._pattern.lastIndex;

		} else {

			logInput( "Need to defer '" + match[ 0 ] + "' since its at end of the chunk." );

			// Set Pointer
			nextOS = match.index;

		}

	}

	// If done with a portion of the input, reduce the
	// current input buffer to be only the unused portion.
	if ( nextOS !== null ) {
		this._inputBuffer = this._inputBuffer.slice( nextOS );
		
	// If no match found reset the internal buffer
	} else {

		this._inputBuffer = "";

	}

	// Reset the regular expression
	this._pattern.lastIndex = 0;

	// Go to next chunk
	getNextChunk();
};

// Create input stream
var inputStream = fs.createReadStream( "./input-sensor.txt" );

// Create a Regex stream
var regexStream = inputStream.pipe( new RegExStream( /\+/i ) );

// Start reading-in word matches when Regex ready
regexStream.on(
	"readable",
	function() {
		var content = null;

		while ( content = this.read() ) {
			logOutput( "Pattern match: " + content.toString( "utf8" ) );    
		}
		// Split the input string with "." or ","
		var split = fs.readFileSync("input-sensor.txt").toString().split(".");
		 console.log(split);

	}
);

// Log input values with color.
function logInput() {

	var chalkedArg = Array.prototype.slice.call( arguments ).map(
		function( value ) {
			return( chalk.magenta( value ) );
		}
	);
	console.log.apply( console, chalkedArg );
}

// Log output values with color.
function logOutput() {

	var chalkedArg = Array.prototype.slice.call( arguments ).map(
		function( value ) {
			return( chalk.bgMagenta.white( value ) );
		}
	);
	console.log.apply( console, chalkedArg );
}

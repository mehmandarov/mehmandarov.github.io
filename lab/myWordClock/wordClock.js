/*
 * #%L
 * MyWordClock
 * %%
 * Copyright (C) 2015 Rustam Mehmandarov
 * 
 * This file is part of MyWordClock.
 * 
 * MyWordClock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * MyWordClock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with MyWordClock.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
 
"use strict";

/**
 * Declare the namespace.
 */
var myWordClock = {
    /**
     * Toggle development mode.
     */
    DEVMODE: true,

    /**
     * Used for converting integers (time) to words.
     */
    words: ["one", "two", "three", "four", "five", "six", "seven", "eight","nine", 
           "ten", "eleven", "twelve", "thirteen", "fourteen", "quarter", "sixteen",
           "seventeen", "eighteen", "nineteen", "twenty", "twenty one", 
           "twenty two", "twenty three", "twenty four", "twenty five", 
           "twenty six", "twenty seven", "twenty eight", "twenty nine", "half"],
           
    /**
     * Define intervals for rounding off minutes in wordClock.
     */
    minuteRoundUp: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],

    /**
     * Define the wordClock.
     */
    wordClock: ["ITEISFTAMPM",
                "JQUARTERCKO",
                "TWENTYFIVEX",
                "HALFCTENGTO",
                "PASTBSEVENL",
                "ONETWOTHREE",
                "FOURFIVESIX",
                "NINEKTWELVE",
                "EIGHTELEVEN",
                "TENPYOCLOCK"
               ],
                
    /**
     * Define the wordClock registry.
     */
    wordClockRegistry: {
        ampm :
                //name       : ['linenumber', 'startchar', 'endchar']
                {am          : [0, 7, 9],
                 pm          : [0, 9, 11]
                },
        minutes :
                {five        : [2, 6, 10],
                 ten         : [3, 5, 8],
                 quarter     : [1, 1, 8],
                 twenty      : [2, 0, 6], 
                 twentyfive  : [2, 0, 10], 
                 half        : [3, 0, 4],
                 past        : [4, 0, 4],
                 to          : [3, 9, 11]
                },
        hours :
                {one         : [5, 0, 3],
                 two         : [5, 3, 6],
                 three       : [5, 6, 11],
                 four        : [6, 0, 4],
                 five        : [6, 4, 8],
                 six         : [6, 8, 11],
                 seven       : [4, 5, 10],
                 eight       : [8, 0, 5],
                 nine        : [7, 0, 4],
                 ten         : [9, 0, 3],
                 eleven      : [8, 5, 11],
                 twelve      : [7, 5, 11],
                 oclock      : [9, 5, 11]
                }
    },

    /**
     * Test and debug function. Tests whether wordClockRegistry{} has correct mapping values.
     * Prints each array value, searches for a match in wordClockRegistry[]
     * and compares to the actual word (used as a key for each clock element
     * in wordClockRegistry{}).
     */
    wordClockRegistryTest: function () {
        for (var elems in wordClockRegistry){
            for (var i in wordClockRegistry[elems]){
                var reg = wordClockRegistry[elems][i];
                console.log(i + ": " + (i.toUpperCase() == wordClock[reg[0]].substring(reg[1], reg[2])));
            }
        }
    },

    /**
     * Updates clock in html. Highlights current time.
     * @param {Number} hours
     * @param {Number} minutes
     * @param {Boolean} roundUp: Whether it is necessary to round up minutes. Intervals defined in minuteRoundUp[]
     */
    updateWordClock: function (h, m, roundUp){
        var time = this.timeToWordsArray(h,m,roundUp);
        var wordClockHighlighted = this.wordClock.slice(); // copy array
        
        for (var i in time['ampm']){
            var ampmToMatch = this.wordClockRegistry['ampm'][time['ampm'][i]];
            var line = ampmToMatch[0];
            var strStart = ampmToMatch[1];
            var strStop = ampmToMatch[2];
            var strToMatch = this.wordClock[line].substring(strStart,strStop);
            wordClockHighlighted[line] = wordClockHighlighted[line].replace(
                                             strToMatch,
                                             '<span id="highlight">'+strToMatch+'</span>'
                                         );
        }
        for (var i in time['minutes']){
            var minutesToMatch = this.wordClockRegistry['minutes'][time['minutes'][i]];
            
            // Handle corner cases, e.g. "twenty five"
            if (minutesToMatch == undefined && time['minutes'][i].indexOf(" ") > -1){
                // Remove spaces and try again
                minutesToMatch = this.wordClockRegistry['minutes'][time['minutes'][i].replace(/\s+/g, "")];
            }
            
            var line = minutesToMatch[0];
            var strStart = minutesToMatch[1];
            var strStop = minutesToMatch[2];
            var strToMatch = this.wordClock[line].substring(strStart,strStop);
            wordClockHighlighted[line] = wordClockHighlighted[line].replace(
                                             strToMatch,
                                             '<span id="highlight">'+strToMatch+'</span>'
                                         );
        }
        for (var i in time['hours']){
            var hoursToMatch = this.wordClockRegistry['hours'][time['hours'][i]];
            
            // Handle corner cases, e.g. "o'clock"
            if (hoursToMatch == undefined && time['hours'][i].indexOf("'") > -1){
                // Remove ' and try again
                hoursToMatch = this.wordClockRegistry['hours'][time['hours'][i].replace("'", "")];
            }
            
            var line = hoursToMatch[0];
            var strStart = hoursToMatch[1];
            var strStop = hoursToMatch[2];
            var strToMatch = this.wordClock[line].substring(strStart,strStop);
            wordClockHighlighted[line] = wordClockHighlighted[line].replace(
                                             strToMatch,
                                             '<span id="highlight">'+strToMatch+'</span>'
                                         );
        }
        
        document.getElementById('wordClock').innerHTML = wordClockHighlighted.join("</br>\n");
    },

    /**
     * Main function. Runs a html page load.
     */
    oldTime: '',
    startClock: function () {
        var today=new Date();
        var h=today.getHours();
        var m=today.getMinutes();
        var time = h+":"+m;
        
        // No need to update clock or run any more code until the time changes
        if (!(time == this.oldTime)){
            if (this.DEVMODE){
                document.getElementById('devModeStatus').innerHTML = "Dev mode: on";
                document.getElementById('timeString').innerHTML = "Real time: " + this.timeToWords(h,m,false);
                document.getElementById('timeString-approx').innerHTML = "Approx time: " + this.timeToWords(h,m,true);
            }
            this.updateWordClock(h,m,true);
            this.oldTime=time;
        }
        var t = setTimeout(function(){myWordClock.startClock()},1000);
    },

    /**
     * Debug function. Converts time to words and returns a string.
     * @param {Number} hours
     * @param {Number} minutes
     * @param {Boolean} roundUp: Whether it is necessary to round up minutes. Intervals defined in minuteRoundUp[]
     * @return {String} String representations of dictionary containing time with attributes as words 
     */
    timeToWords: function (hrs, mins, roundUp){
        return JSON.stringify(this.timeToWordsArray(hrs, mins, roundUp));
    },

    /**
     * Converts time to words and returns a dictionary of elements.
     * @param {Number} hours
     * @param {Number} minutes
     * @param {Boolean} roundUp: Whether it is necessary to round up minutes. Intervals defined in minuteRoundUp[]
     * @return {Dictionary} time with attributes as words 
     */
    timeToWordsArray: function (hrs, mins, roundUp){
        var header="It is";
        var msg={};
        var hr="";
        var mn="";
        
        var ampm = hrs >= 12 ? 'pm' : 'am';
        
        if (hrs > 12){
            hrs=hrs-12;
        }
        
        if (roundUp){
            for (var m in this.minuteRoundUp){
                if (mins <= this.minuteRoundUp[m]) {
                    mins = this.minuteRoundUp[m];
                    break;
                }
            }
        }

        if (mins == 0){
            hr = this.words[hrs-1];
            msg = {
                    ampm : [ampm],
                    minutes : [],
                    hours : [hr, "o'clock"]
                  };
        } else if (mins == 60){
            hr = this.words[hrs];
            msg = {
                    ampm : [ampm],
                    minutes : [],
                    hours : [hr, "o'clock"]
                  };
        } else if (mins < 31){
            if (hrs > 0) { 
                hr = this.words[hrs-1];
            } else {
                // Corner case: it's 00/12 o'clock
                hr = this.words[11];
            }
            mn = this.words[mins-1];
            msg = {
                   ampm : [ampm],
                   minutes : [mn, "past"],
                   hours : [hr]
              };
        } else {
            hr = this.words[hrs];
            mn = this.words[(60-mins-1)];
            msg = {
                   ampm : [ampm],
                   minutes : [mn, "to"],
                   hours : [hr]
                  };
        }
        
        return msg
    }
}

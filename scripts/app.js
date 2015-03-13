'use strict';

// Inspiration: http://bl.ocks.org/insin/317108e9df278c350f30
var Firebase = require('firebase');
var React = require('react');
var FIREBASE_URL = 'https://sillysay.firebaseio.com/';

var speechSettings = {
  rate: 0.1, // 0.1-10
  pitch: 1, // 0-2
  lang: 'en-US'
};

// TODO: Gear icon, expand/collapse.
var SettingsPanel = React.createClass({
  render() {
    var voices = speechSynthesis.getVoices();

    {
      JSON.stringify(voices)
    }
    return <div>

    </div>
  }
});

// Some words don't get pronounced correctly.
var phoneticSpelling = {
  monkey: 'monkey',
  Misha: 'Meesha',
  Obi: 'Ohbee'
}

var WordButton = React.createClass({
  propTypes: {
    wordClicked: React.PropTypes.func.isRequired,
    word: React.PropTypes.string.isRequired
  },

  wordClicked() {
    this.props.wordClicked(this.props.word)
  },

  render() {
    var wordButtonStyles = {
      minWidth: 100,
      minHeight: 100,
      margin: 10
    };
    return (
      <button className='button-xlarge pure-button pure-button-primary'
        onClick={this.wordClicked}
        style={wordButtonStyles}>
        {this.props.word}
      </button>
    );
  }
});

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

var SoundBoard = React.createClass({
  propTypes: {
    wordClicked: React.PropTypes.func.isRequired,
    words: React.PropTypes.array.isRequired
  },

  renderWordButtons() {
    var words = this.props.words;
    return words.map(function (word, index) {
      return (<WordButton
        className='pure-u-1-3'
        key={index}
        word={word}
        wordClicked={this.props.wordClicked}
      />);
    }.bind(this))
  },
  render() {
    return (
      <div className='pure-g'>
        {this.renderWordButtons()}
      </div>
    );
  }
});


var WordForm = React.createClass({

  props: {
    submitHandler: React.PropTypes.func.isRequired
  },

  submit(e) {
    var word, wordInputNode;
    e.preventDefault();
    wordInputNode = this.refs.wordInput.getDOMNode();
    word = wordInputNode.value;
    this.props.submitHandler(word);
    wordInputNode.value = '';
  },

  render() {
    return (
      <form onSubmit={this.submit}
        className='pure-form'>
        <label htmlFor='word-input'>New Word</label>
        <input id='word-input' type='text' ref='wordInput'/>
      &nbsp;
        <button className='button-success pure-button' type='submit'>
        Add Word
        </button>
      </form>
    );
  }
});

var SentenceBuilder = React.createClass({
  propTypes: {
    cancelSentence: React.PropTypes.func.isRequired,
    saveSentence: React.PropTypes.func.isRequired,
    words: React.PropTypes.array.isRequired
  },

  render() {
    return <div>
    {this.props.words.join(' ')}
      <button onClick={this.props.saveSentence}>Save</button>
      <button onClick={this.props.cancelSentence}>Cancel</button>
    </div>
  }
});

module.exports = SentenceBuilder;

var INITIAL_WORDS = [
  'Jacob',
  'is',
  'a',
  'Silly',
  'Monkey',
  'Tickle',
  'Obi',
  'Misha',
  'Mommy',
  'George',
  'Cat in the hat',
  'Monkey',
  'John John',
  'Grammie',
  'snow',
  'Cat',
  'Jump',
  'Book',
  'Car',
  'Ball',
  'Boston',
  'Silly'
];
var App = React.createClass({

  wordClicked(word) {
    var utterance = new SpeechSynthesisUtterance();
    word = phoneticSpelling[word] || word;
    utterance.lang = speechSettings.lang;
    utterance.pitch = speechSettings.pitch;
    utterance.rate = speechSettings.rate;
    utterance.text = word == '...' ? 'Jacob is a tutu' : word;
    utterance.volume = 0.7; // 0 to 1
    speechSynthesis.speak(utterance);
    if (this.areRecording()) {
      this.setState({sentence: this.state.sentence.concat([word])});
    }
  },

  toArray(obj) {
    obj = obj || {};
    return Object.keys(obj).map((key) => obj[key]);
  },

  componentDidMount() {
    var key = 'abc123';
    this.firebaseRef = new Firebase(FIREBASE_URL);
    this.wordsRef = this.firebaseRef.child(key+'/words');
    this.wordsRef.on('value', function (snapshot) {

      setTimeout(function () {
        var words = this.toArray(snapshot.val());
        this.setState({words});

        if (!words.length) {
          this.wordsRef.set(INITIAL_WORDS); // SEED Firebase initially
        }
      }.bind(this), 0);
    }.bind(this));

    this.sentenceRef = this.firebaseRef.child(key+'/sentences');
    this.sentenceRef.on('value', function (snapshot) {

      setTimeout(function () {
        //debugger;
        var sentences = this.toArray(snapshot.val());
        this.setState({sentences});

        if (!sentences.length) {
          this.sentenceRef.set([]); // SEED Firebase initially
        }
      }.bind(this), 0);
    }.bind(this));
  },

  getInitialState() {
    return ({
      sentence: null,
      sentences: [],
      words: []
    });
  },

  _shuffleWords() {
    this.setState({words: shuffle(this.state.words)});
  },

  handleWordInputSubmit(word) {
    this.wordsRef.push(word);
  },

  saveSentence() {
    this.sentenceRef.push(this.state.sentence.join(' '));
  },

  areRecording() {
    return (this.state.sentence !== null);
  },

  startRecording() {
    this.setState({sentence: []});
  },

  cancelSentence() {
    this.setState({sentence: null});
  },

  render() {
    var activeSentence = this.areRecording() ? <SentenceBuilder cancelSentence={this.cancelSentence} saveSentence={this.saveSentence} words={this.state.sentence} /> :
      <button onClick={this.startRecording}>RECORD</button> // TODO: BIG RED BUTTON
    return (
      <div>
        <SettingsPanel/>
        <WordForm submitHandler={this.handleWordInputSubmit}/>
        <SoundBoard wordClicked={this.wordClicked} words={this.state.words} />
        <SoundBoard wordClicked={this.wordClicked} words={this.state.sentences} />
        {activeSentence}
      </div>
    );

    //<button onClick={this._shuffleWords}>Shuffle</button>
  }
});

module.exports = App;




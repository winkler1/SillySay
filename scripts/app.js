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
    word: React.PropTypes.string.isRequired,
    color: React.PropTypes.string.isRequired
  },

  wordClicked() {
    this.props.wordClicked(this.props.word)
  },

  render() {
    var buttonStyles = {
      minWidth: 100,
      minHeight: 100,
      margin: 10,
      color: '#fff',
      backgroundColor: `${this.props.color}`
    };

    return (
      <button className='pure-button'
              onClick={this.wordClicked}
              style={buttonStyles}>
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
    words: React.PropTypes.array.isRequired,
    color: React.PropTypes.string.isRequired
  },

  renderWordButtons() {
    var words = this.props.words;
    return words.map( (word, index) => {
      return (
          <WordButton key={index}
                      word={word}
                      color={this.props.color}
                      wordClicked={this.props.wordClicked}/>
      );
    })
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

  handleSubmit(e) {
    var word, wordInputNode;
    e.preventDefault();
    wordInputNode = this.refs.wordInput.getDOMNode();
    word = wordInputNode.value;
    this.props.submitHandler(word);
    wordInputNode.value = '';
  },

  render() {
    var formStyle = {
      marginTop: 10
    }
    return (
      <form style={formStyle} onSubmit={this.handleSubmit} className='pure-form'>
        <input type='text' ref='wordInput'/>&nbsp;
        <button className='pure-button' type='submit'>
          Add New Word
        </button>
      </form>
    );
  }
});

var SentenceBuilder = React.createClass({
  propTypes: {
    words: React.PropTypes.array.isRequired
  },

  render() {
    return (
      <div style={{ textAlign: 'center', padding: 10 }}>
        { this.props.words.join(' ') }
      </div>
    );
  }
});

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
    if (this.isRecording()) {
      this.setState({sentence: this.state.sentence.concat([word])});
    }
  },

  toArray(obj) {
    obj = obj || {};
    return Object.keys(obj).map( (key) => obj[key] );
  },

  componentDidMount() {
    var hashKey = null // TODO: setup hashed url fragment for firebase

    this.firebaseRef = new Firebase(FIREBASE_URL);
    this.wordsRef = this.firebaseRef.child(`${hashKey}/words`);
    this.wordsRef.on('value', (snapshot) => {

      setTimeout( () => {
        var words = this.toArray(snapshot.val());
        this.setState({words});

        if (!words.length) {
          this.wordsRef.set(INITIAL_WORDS); // SEED Firebase initially
        }
      }, 0);
    });

    this.sentenceRef = this.firebaseRef.child(`${hashKey}/sentences`);
    this.sentenceRef.on('value', (snapshot) => {

      setTimeout( () => {
        //debugger;
        var sentences = this.toArray(snapshot.val());
        this.setState({sentences});

        if (!sentences.length) {
          this.sentenceRef.set([]); // SEED Firebase initially
        }
      }, 0);
    });
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

  saveRecording() {
    this.sentenceRef.push(this.state.sentence.join(' '));
    this.setState({sentence: null});
  },

  isRecording() {
    return (this.state.sentence !== null);
  },

  startRecording() {
    this.setState({sentence: []});
  },

  renderSentenceBuilder() {
    if (this.isRecording()) {
      return (
        <SentenceBuilder words={this.state.sentence} />
      );
    }
  },

  renderSentenceBuilderButton() {
    var stopStyles = {
      width: '100%',
      backgroundColor: 'rgb(202, 60, 60)',
      fontSize: '200%',
      color: '#fff'
    };

    var startStyles = {
      width: '100%',
      backgroundColor: 'rgb(28, 184, 65)',
      fontSize: '200%',
      color: '#fff'
    }

    if (this.isRecording()) {
      return (
        <button onClick={this.saveRecording}
                className='pure-button'
                style={stopStyles}>
          STOP
        </button>
      );
    } else {
      return (
        <button onClick={this.startRecording}
                className='pure-button'
                style={startStyles}>
          RECORD
        </button>
      );
    }
  },

  render() {
    var containerStyles = {
      maxWidth: 900,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
    return (
      <div style={containerStyles}>
        <SettingsPanel/>
        <WordForm submitHandler={this.handleWordInputSubmit}/>
        <SoundBoard wordClicked={this.wordClicked} words={this.state.words} color='#0078e7' />
        <hr />
        <div style={{ marginTop: 10 }}>
          {this.renderSentenceBuilderButton()}
        </div>
        <div style={{ marginTop: 10 }}>
          {this.renderSentenceBuilder()}
        </div>
        < hr/>
        <SoundBoard wordClicked={this.wordClicked} words={this.state.sentences} color='#42B8DD'/>
      </div>
    );

    //<button onClick={this._shuffleWords}>Shuffle</button>
  }
});

module.exports = App;




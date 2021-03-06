import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import InstructionsList from './InstructionsList.js';
import PropTypes from 'prop-types';
const gd = global.gd;

const addDefaultProps = function(props, elementProps) {
  props.onTouchStart = elementProps.onTouchStart;
  props.onTouchMove = elementProps.onTouchMove;
  props.onTouchEnd = elementProps.onTouchEnd;
  props.onMouseDown = elementProps.onMouseDown;
  props.onMouseUp = elementProps.onMouseUp;
  props.onMouseLeave = elementProps.onMouseLeave;

  return props;
};

class UnknownEvent extends Component {
  static propTypes = {
    event: PropTypes.object.isRequired,
  };

  render() {
    return React.createElement(
      'p',
      addDefaultProps(
        {
          className: this.props.className,
        },
        this.props
      ),
      'Unknown event of type ' + this.props.event.getType()
    );
  }
}

class StandardEvent extends Component {
  static propTypes = {
    event: PropTypes.object.isRequired,
  };

  render() {
    var standardEvent = gd.asStandardEvent(this.props.event);

    var conditionsElement = React.createElement(InstructionsList, {
      instrsList: standardEvent.getConditions(),
      areConditions: true,
      key: 'theConditions',
      className: 'col-xs-6 conditions-list',
      callbacks: this.props.callbacks,
    });
    var actionsElement = React.createElement(InstructionsList, {
      instrsList: standardEvent.getActions(),
      areConditions: false,
      key: 'theActions',
      className: 'col-xs-6 actions-list',
      callbacks: this.props.callbacks,
    });

    return React.createElement(
      'div',
      addDefaultProps(
        {
          className: 'row ' + this.props.className,
        },
        this.props
      ),
      [conditionsElement, actionsElement]
    );
  }
}

class GroupEvent extends Component {
  static propTypes = {
    event: PropTypes.object.isRequired,
  };

  handleClick() {
    this.props.callbacks.onEditEventTemplate(this.props.event);
  }

  render() {
    var groupEvent = gd.asGroupEvent(this.props.event);

    var children = [];
    children.push(
      React.createElement(
        'span',
        {
          key: 'title',
          className: 'lead',
        },
        groupEvent.getName()
      )
    );

    if (groupEvent.getSource() !== '') {
      children.push(
        React.createElement(
          'span',
          {
            key: 'editButton',
            className: 'btn btn-sm btn-default pull-right',
          },
          'Click/touch to edit'
        )
      );
    }

    return React.createElement(
      'div',
      addDefaultProps(
        {
          className: 'row ' + this.props.className,
          onClick: this.handleClick,
        },
        this.props
      ),
      children
    );
  }
}

class CommentEvent extends Component {
  static propTypes = {
    event: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      editing: false,
    };
  }

  handleClick() {
    if (this.props.event.dragging) return;

    this.setState(
      {
        editing: true,
      },
      function() {
        var theInput = ReactDOM.findDOMNode(this.refs.theInput);
        theInput.focus();
        theInput.value = gd.asCommentEvent(this.props.event).getComment();
      }
    );
  }

  handleBlur() {
    gd
      .asCommentEvent(this.props.event)
      .setComment(ReactDOM.findDOMNode(this.refs.theInput).value);
    this.setState({
      editing: false,
    });
  }

  render() {
    var commentEvent = gd.asCommentEvent(this.props.event);
    var children = [];
    if (!this.state.editing) {
      children.push(
        React.createElement('p', {
          key: 'p',
          dangerouslySetInnerHTML: {
            __html: commentEvent
              .getComment()
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\n/g, '<br>'),
          },
        })
      );
    } else {
      children.push(
        React.createElement('textarea', {
          key: 'textarea',
          type: 'text',
          rows: 5,
          onBlur: this.handleBlur,
          ref: 'theInput',
        })
      );
    }

    return React.createElement(
      'div',
      addDefaultProps(
        {
          className: this.props.className,
          onClick: this.handleClick,
        },
        this.props
      ),
      children
    );
  }
}

export default {
  components: {
    unknownEvent: UnknownEvent,
    'BuiltinCommonInstructions::Standard': StandardEvent,
    'BuiltinCommonInstructions::Group': GroupEvent,
    'BuiltinCommonInstructions::Comment': CommentEvent,
  },
  getEventComponent: function(event) {
    if (this.components.hasOwnProperty(event.getType()))
      return this.components[event.getType()];
    else
      return this.components.unknownEvent;
  },
  registerEvent: function(eventType, renderFunction) {
    if (!this.components.hasOwnProperty(eventType)) {
      console.warn(
        'Tried to register renderer for events "' +
          eventType +
          '", but a renderer already exists.'
      );
      return;
    }

    this.components[eventType] = renderFunction;
  },
};

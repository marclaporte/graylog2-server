// @flow strict
import * as React from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';
import styled, { css, type StyledComponent } from 'styled-components';

import { type ThemeInterface } from 'theme';
import { Button, ButtonToolbar, Col, Nav, NavItem, Row } from 'components/graylog';

import Icon from './Icon';

const SubnavigationCol: StyledComponent<{}, ThemeInterface, Col> = styled(Col)(({ theme }) => css`
  border-right: ${theme.colors.gray[80]} solid 1px;
`);

const HorizontalCol: StyledComponent<{}, ThemeInterface, Col> = styled(Col)`
  margin-bottom: 15px;
`;

const HorizontalButtonToolbar = styled(ButtonToolbar)`
  padding: 7px;
`;

type StepKey = number | string;

export type Step = {
  key: StepKey,
  title: string,
  component: React.Node,
  disabled?: boolean,
};

export type Steps = Array<Step>;

type Props = {
  steps: Steps,
  activeStep: ?StepKey,
  onStepChange: (StepKey) => void,
  children: PropTypes.elementType,
  horizontal: boolean,
  justified: boolean,
  containerClassName: string,
  NavigationComponent: Nav,
  hidePreviousNextButtons: boolean,
};

type State = {
  selectedStep: StepKey,
};

/**
 * Component that renders a wizard, letting the consumers of the component
 * manage the state. It will render at least two columns: First column will hold
 * the steps the wizard will take. Second column will render the component of the
 * selected step. In a optional third column the consumer can render a preview.
 */
class Wizard extends React.Component<Props, State> {
  static propTypes = {
    /**
     * Array of objects which will describe the wizard. The object must
     * contain a unique 'key' attribute, a 'title' which will be shown as step link on the left side and
     * a 'component' attribute which will hold the component which is to render for the step.
     */
    steps: PropTypes.arrayOf(PropTypes.object).isRequired,
    /**
     * Indicates the active step that should be rendered, in case the step state is stored outside this
     * component, and it is being used in a controlled way.
     * The prop **must** take the value of one of the keys in `steps`, otherwise a warning is logged in the console.
     */
    activeStep: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /**
     * Callback which is called when the user changes the step. As an argument the callback gets the key
     * of the next step.
     */
    onStepChange: PropTypes.func,
    /** Optional component which can be rendered on the right side e.g a preview */
    children: PropTypes.element,
    /** Indicates if wizard should be rendered in horizontal or vertical */
    horizontal: PropTypes.bool,
    /** Indicates if wizard should take the full width of their parent */
    justified: PropTypes.bool,
    /** Customize the container CSS class used by this component */
    containerClassName: PropTypes.string,
    /** Customize the navigation componment used by Wizard */
    NavigationComponent: PropTypes.elementType,
    /** Indicates if wizard should render next/previous buttons or not */
    hidePreviousNextButtons: PropTypes.bool,
  };

  static defaultProps = {
    children: undefined,
    activeStep: undefined,
    onStepChange: () => {},
    horizontal: false,
    justified: false,
    containerClassName: 'content',
    NavigationComponent: Nav,
    hidePreviousNextButtons: false,
  };

  constructor(props: Props) {
    super(props);

    this._warnOnInvalidActiveStep(props.activeStep, props.steps);

    this.state = {
      selectedStep: props.steps[0].key,
    };
  }

  componentDidUpdate() {
    const { activeStep, steps } = this.props;

    this._warnOnInvalidActiveStep(activeStep, steps);
  }

  _warnOnInvalidActiveStep = (activeStep: ?StepKey, steps: Steps) => {
    if (activeStep === undefined || activeStep === null) {
      return;
    }

    if (!this._isValidActiveStep(activeStep, steps)) {
      // eslint-disable-next-line no-console
      console.warn(`activeStep ${activeStep} is not a key in any element of the 'steps' prop!`);
    }
  };

  _isValidActiveStep = (activeStep: ?StepKey, steps: Steps) => {
    if (activeStep === undefined || activeStep === null) {
      return false;
    }

    return find(steps, { key: activeStep });
  };

  _getSelectedStep = () => {
    const { activeStep, steps } = this.props;
    const { selectedStep } = this.state;

    return (this._isValidActiveStep(activeStep, steps) ? activeStep : selectedStep);
  };

  _wizardChanged = (eventKey: StepKey) => {
    const { activeStep, onStepChange } = this.props;

    onStepChange(eventKey);

    // If activeStep is given, component should behave in a controlled way and let consumer decide which step to render.
    if (!activeStep) {
      this.setState({ selectedStep: eventKey });
    }
  };

  _disableButton = (direction: 'previous' | 'next') => {
    const { steps } = this.props;
    const selectedStep = this._getSelectedStep();
    const len = steps.length;
    const disabledPosition = direction === 'next' ? (len - 1) : 0;
    const currentPosition = steps.findIndex((step) => step.key === this._getSelectedStep());
    const otherPosition = direction === 'next' ? (currentPosition + 1) : (currentPosition - 1);
    const otherStep = (steps[otherPosition] || {});

    return steps[disabledPosition].key === selectedStep || otherStep.disabled;
  };

  _onNext = () => {
    const { steps } = this.props;

    this._wizardChanged(steps[this._getSelectedIndex() + 1].key);
  };

  _onPrevious = () => {
    const { steps } = this.props;

    this._wizardChanged(steps[this._getSelectedIndex() - 1].key);
  };

  _getSelectedIndex = () => {
    const { steps } = this.props;
    const selectedStep = this._getSelectedStep();

    return steps.map((step) => step.key).indexOf(selectedStep);
  };

  _renderVerticalStepNav = () => {
    const { justified, NavigationComponent, steps, hidePreviousNextButtons } = this.props;
    const selectedStep = this._getSelectedStep();

    return (
      <SubnavigationCol md={2}>
        <NavigationComponent stacked
                             bsStyle="pills"
                             activeKey={selectedStep}
                             onSelect={this._wizardChanged}
                             justified={justified}>
          {steps.map((navItem) => {
            return (
              <NavItem key={navItem.key} eventKey={navItem.key} disabled={navItem.disabled}>{navItem.title}</NavItem>
            );
          })}
        </NavigationComponent>
        {!hidePreviousNextButtons && (
          <>
            <br />
            <Row>
              <Col xs={6}>
                <Button onClick={this._onPrevious}
                        bsSize="small"
                        bsStyle="info"
                        disabled={this._disableButton('previous')}>Previous
                </Button>
              </Col>
              <Col className="text-right" xs={6}>
                <Button onClick={this._onNext}
                        bsSize="small"
                        bsStyle="info"
                        disabled={this._disableButton('next')}>Next
                </Button>
              </Col>
            </Row>
          </>
        )}
      </SubnavigationCol>
    );
  };

  _renderHorizontalStepNav = () => {
    const selectedStep = this._getSelectedStep();
    const { justified, NavigationComponent, steps, hidePreviousNextButtons } = this.props;

    return (
      <HorizontalCol sm={12}>
        {!hidePreviousNextButtons && (
          <div className="pull-right">
            <HorizontalButtonToolbar>
              <Button onClick={this._onPrevious}
                      bsSize="xsmall"
                      bsStyle="info"
                      disabled={this._disableButton('previous')}>
                <Icon name="caret-left" />
              </Button>
              <Button onClick={this._onNext}
                      bsSize="xsmall"
                      bsStyle="info"
                      disabled={this._disableButton('next')}>
                <Icon name="caret-right" />
              </Button>
            </HorizontalButtonToolbar>
          </div>
        )}
        <NavigationComponent bsStyle="pills"
                             activeKey={selectedStep}
                             onSelect={this._wizardChanged}
                             justified={justified}>
          {steps.map((navItem) => {
            return (
              <NavItem key={navItem.key} eventKey={navItem.key} disabled={navItem.disabled}>{navItem.title}</NavItem>);
          })}
        </NavigationComponent>
      </HorizontalCol>
    );
  };

  render() {
    const { steps, horizontal, containerClassName, children } = this.props;
    let leftComponentCols;

    if (children) {
      leftComponentCols = 7;
    } else {
      leftComponentCols = horizontal ? 12 : 10;
    }

    const rightComponentCols = horizontal ? 5 : 3; // If horizontal, use more space for this component

    return (
      <Row className={containerClassName}>
        {horizontal ? this._renderHorizontalStepNav() : this._renderVerticalStepNav()}
        <Col md={leftComponentCols}>
          {steps[this._getSelectedIndex()].component}
        </Col>
        {children && (
          <Col md={rightComponentCols}>
            {children}
          </Col>
        )}
      </Row>
    );
  }
}

export default Wizard;

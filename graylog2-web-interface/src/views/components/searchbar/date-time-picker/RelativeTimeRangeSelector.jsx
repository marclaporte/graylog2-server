// @flow strict
import * as React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Field } from 'formik';
import styled, { css, type StyledComponent } from 'styled-components';

import { type ThemeInterface } from 'theme';
import Input from 'components/bootstrap/Input';
import { Icon, Select } from 'components/common';

type Props = {
  disabled: boolean,
  originalTimeRange: {
    range: string | number,
  },
  limitDuration: number,
  setDisableApply: (boolean) => void,
};

const RANGE_TYPES = [
  {
    type: 'seconds',
    label: 'Seconds',
  }, {
    type: 'minutes',
    label: 'Minutes',
  }, {
    type: 'hours',
    label: 'Hours',
  }, {
    type: 'days',
    label: 'Days',
  }, {
    type: 'weeks',
    label: 'Weeks',
  },
];

const RelativeWrapper: StyledComponent<{}, void, HTMLDivElement> = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

const RangeWrapper: StyledComponent<{}, void, HTMLDivElement> = styled.div`
  flex: 4;
  align-items: center;
  display: grid;
  grid-template-columns: max-content repeat(5, 1fr) max-content;
  grid-template-rows: repeat(2, 1fr) auto;
  grid-column-gap: 0;
  grid-row-gap: 0;
  
`;

const InputWrap: StyledComponent<{}, void, HTMLDivElement> = styled.div`
  grid-area: 2 / 1 / 3 / 3;
  position: relative;
  
  .form-group {
    margin: 0;
  }
`;

const StyledSelect: StyledComponent<{}, void, typeof Select> = styled(Select)`
  grid-area: 2 / 3 / 3 / 7;
  margin: 0 12px;
`;

const StyledIcon: StyledComponent<{}, void, typeof Icon> = styled(Icon)`
  flex: 0.75;
`;

const RangeTitle = styled.h3`
  grid-area: 1 / 1 / 2 / 2;
`;

const Ago: StyledComponent<{}, ThemeInterface, HTMLSpanElement> = styled.span(({ theme }) => css`
  grid-area: 2 / 7 / 3 / 8;
  font-size: ${theme.fonts.size.large};

  ::after {
    content: 'ago';
  }
`);

const RangeCheck: StyledComponent<{}, ThemeInterface, HTMLLabelElement> = styled.label(({ theme }) => css`
  font-size: ${theme.fonts.size.small};
  grid-area: 1 / 2 / 2 / 8;
  margin-left: 15px;
  font-weight: normal;
  align-self: self-end;
  
  &.shortened {
    grid-area: 1 / 2 / 2 / 4;
    text-decoration: line-through;
    cursor: not-allowed;
  }
  
  input {
    margin-right: 6px;
  }
`);

const ErrorMessage: StyledComponent<{}, ThemeInterface, HTMLSpanElement> = styled.span(({ theme }) => css`
  color: ${theme.colors.variant.dark.danger};
  grid-area: 3 / 1 / 3 / 8;
  font-size: ${theme.fonts.size.tiny};
  font-style: italic;
  padding: 3px;
`);

const buildRangeTypes = (limitDuration) => RANGE_TYPES.map(({ label, type }) => {
  const typeDuration = moment.duration(1, type).asSeconds();

  if (limitDuration === 0 || typeDuration <= limitDuration) {
    return { label, value: type };
  }

  return null;
}).filter(Boolean);

const RelativeTimeRangeSelector = ({ disabled, originalTimeRange, limitDuration, setDisableApply }: Props) => {
  const availableRangeTypes = buildRangeTypes(limitDuration);
  const _isValidRange = (value) => !(limitDuration === 0 || (value <= limitDuration && limitDuration !== 0));

  return (
    <RelativeWrapper>
      <Field name="tempTimeRange.range" validate={_isValidRange}>
        {({ field: { value, onChange, name }, meta: { error } }) => {
          setDisableApply(error);

          const fromValue = RANGE_TYPES.map(({ type }) => {
            const isAllTime = value === 0;
            const diff = moment.duration(value, 'seconds').as(type);

            if (diff - Math.floor(diff) === 0) {
              return {
                ...originalTimeRange,
                rangeValue: diff || 0,
                rangeType: isAllTime ? 'seconds' : type,
                rangeAllTime: isAllTime,
                range: value,
              };
            }

            return null;
          }).filter(Boolean).pop();

          const _onChangeTime = (event) => {
            const newTimeValue = moment.duration(event.target.value, fromValue.rangeType).asSeconds();

            onChange({ target: { name, value: newTimeValue } });
          };

          const _onChangeType = (type) => {
            const newTimeValue = moment.duration(fromValue.rangeValue, type).asSeconds();

            onChange({ target: { name, value: newTimeValue } });
          };

          const _onCheckAllTime = (event) => {
            onChange({ target: { name, value: event.target.checked ? 0 : originalTimeRange.range } });
          };

          return (
            <RangeWrapper>
              <RangeTitle>From:</RangeTitle>
              <RangeCheck htmlFor="relative-all-time" className={limitDuration !== 0 && 'shortened'}>
                <input type="checkbox"
                       id="relative-all-time"
                       value="0"
                       checked={fromValue.rangeAllTime}
                       onChange={_onCheckAllTime}
                       disabled={limitDuration !== 0} />All Time
              </RangeCheck>
              <InputWrap>
                <Input id="relative-timerange-from-value"
                       name="relative-timerange-from-value"
                       disabled={disabled || fromValue.rangeAllTime}
                       type="number"
                       value={fromValue.rangeValue}
                       title="Set the range value"
                       onChange={_onChangeTime}
                       bsStyle={error ? 'error' : null} />
              </InputWrap>
              <StyledSelect id="relative-timerange-from-length"
                            name="relative-timerange-from-length"
                            disabled={disabled || fromValue.rangeAllTime}
                            value={fromValue.rangeType}
                            options={availableRangeTypes}
                            placeholder="Select a range length"
                            onChange={_onChangeType}
                            clearable={false} />

              <Ago />
              {error && (
                <ErrorMessage>
                  Admin has limited searching to {moment.duration(-limitDuration, 'seconds').humanize(true)}
                </ErrorMessage>
              )}
            </RangeWrapper>
          );
        }}
      </Field>

      <StyledIcon name="arrow-right" />

      <RangeWrapper>
        <RangeTitle>Until:</RangeTitle>
        <RangeCheck htmlFor="relative-offset">
          <input type="checkbox" id="relative-offset" checked disabled />Now
        </RangeCheck>

        <InputWrap>
          <Input id="relative-timerange-until-value"
                 disabled
                 type="number"
                 value="0"
                 min="1"
                 title="Set the offset value"
                 name="relative-timerange-until-value"
                 onChange={() => {}} />
        </InputWrap>

        <StyledSelect id="relative-timerange-until-length"
                      disabled
                      value={RANGE_TYPES[0].type}
                      options={availableRangeTypes}
                      placeholder="Select an offset"
                      name="relative-timerange-until-length"
                      onChange={() => {}} />
        <Ago />
      </RangeWrapper>
    </RelativeWrapper>
  );
};

RelativeTimeRangeSelector.propTypes = {
  limitDuration: PropTypes.number,
  disabled: PropTypes.bool,
  originalTimeRange: PropTypes.shape({
    range: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};

RelativeTimeRangeSelector.defaultProps = {
  disabled: false,
  limitDuration: 0,
};

export default RelativeTimeRangeSelector;
/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { Link, useLocation, useLinkClickHandler } from 'react-router-dom';

const _targetPathname = (target: string) => String(target).split(/[?#]/)[0];

const _setActiveClassName = (pathname: string, to: string, currentClassName: string, displayName: string) => {
  const targetPathname = _targetPathname(to);
  const isActive = targetPathname === pathname;
  const isButton = displayName === 'Button';

  return isButton && isActive
    ? `active ${currentClassName ?? ''}`
    : currentClassName;
};

type ChildrenProps = {
  onClick: (e?: any) => void,
  className: string,
  href: string,
};
type Props = {
  children: React.ReactElement<ChildrenProps, React.ComponentType>,
  onClick?: () => unknown,
  disabled?: boolean,
  to: string,
};

const isLeftClickEvent = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => (e.button === 0);

const isModifiedEvent = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);

const LinkContainer = ({ children, onClick, to, ...rest }: Props) => {
  const { pathname } = useLocation();
  const { props: { onClick: childrenOnClick, className }, type: { displayName } } = React.Children.only(children);
  const childrenClassName = useMemo(() => _setActiveClassName(pathname, to, className, displayName), [pathname, to, className, displayName]);
  const handleClick = useLinkClickHandler(to);
  const _onClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isLeftClickEvent(e) || isModifiedEvent(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (childrenOnClick) {
      childrenOnClick();
    }

    if (onClick) {
      onClick();
    }

    handleClick(e);
  }, [childrenOnClick, onClick, to]);

  return React.cloneElement(React.Children.only(children), { ...rest, className: childrenClassName, onClick: _onClick, href: to });
};

export {
  Link,
  LinkContainer,
};

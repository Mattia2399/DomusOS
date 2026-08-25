import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { MembersCard } from './MembersCard';

const widget: Widget = {
  id: 'members-card-test',
  kind: 'members',
  title: 'Famiglia',
  entityId: 'group.house_members',
  status: 'home',
  isOn: true,
  layout: { i: 'members-card-test', x: 0, y: 0, w: 3, h: 2 },
};

describe('MembersCard', () => {
  afterEach(cleanup);

  it('exposes the registry variant without changing the existing composition', () => {
    const { container, getByTitle } = render(
      <MembersCard
        widget={widget}
        isSelected={false}
        isEditMode={false}
        onClick={() => undefined}
        displayVariant="full"
        houseMembers={[
          { id: 'person.mattia', name: 'Mattia', isCurrent: true },
        ]}
        gridBreakpoint="xl"
      />,
    );

    expect(container.firstElementChild?.getAttribute('data-card-variant')).toBe('full');
    expect(getByTitle('Mattia')).toBeTruthy();
  });
});

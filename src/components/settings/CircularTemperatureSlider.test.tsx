import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CircularTemperatureSlider } from './CircularTemperatureSlider';

describe('CircularTemperatureSlider', () => {
  afterEach(cleanup);

  it('commits the last value reported while dragging instead of recalculating on release', () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { getByRole } = render(
      <CircularTemperatureSlider
        value={20}
        min={10}
        max={30}
        step={0.5}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const slider = getByRole('slider') as HTMLDivElement;
    slider.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    });
    slider.setPointerCapture = vi.fn();
    slider.hasPointerCapture = vi.fn(() => true);
    slider.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(slider, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 100, clientY: 20 });
    fireEvent.pointerMove(slider, { pointerId: 1, pointerType: 'mouse', clientX: 180, clientY: 100 });
    const lastDraggedValue = onChange.mock.calls.at(-1)?.[0];
    const changeCountBeforeRelease = onChange.mock.calls.length;

    fireEvent.pointerUp(slider, { pointerId: 1, pointerType: 'mouse', clientX: 20, clientY: 100 });

    expect(lastDraggedValue).toBeTypeOf('number');
    expect(onChange).toHaveBeenCalledTimes(changeCountBeforeRelease);
    expect(onCommit).toHaveBeenCalledWith(lastDraggedValue);
  });
});

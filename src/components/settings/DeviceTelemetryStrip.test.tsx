import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Wifi } from 'lucide-react';
import { DeviceTelemetryStrip } from './DeviceTelemetryStrip';

describe('DeviceTelemetryStrip', () => {
  afterEach(cleanup);

  it('renders nothing when no supported telemetry is available', () => {
    const { container } = render(<DeviceTelemetryStrip items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('keeps supported values in one compact information strip', () => {
    const { getByLabelText, getByText } = render(
      <DeviceTelemetryStrip
        items={[
          { id: 'connection', icon: <Wifi size={15} />, label: 'Connessione', value: 'Connessa', tone: 'success' },
        ]}
      />,
    );
    expect(getByLabelText('Informazioni dispositivo')).toBeTruthy();
    expect(getByText('Connessione')).toBeTruthy();
    expect(getByText('Connessa')).toBeTruthy();
  });
});

import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import GlobalAudioPlayer from '../../components/GlobalAudioPlayer';
import React from 'react';

// Mock the App Context
const mockSetMusicPlayerState = vi.fn();
vi.mock('../../context/AppContext', () => ({
  useAppContext: () => ({
    musicPlayerState: {
      currentTrackId: 1,
      isShuffled: true,
      currentPlaylistId: 1,
      volume: 1,
    },
    setMusicPlayerState: mockSetMusicPlayerState,
    tracks: [
      { id: 1, fileId: 'file1' },
      { id: 2, fileId: 'file2' },
      { id: 3, fileId: 'file3' },
    ],
    playlists: [
      { id: 1, name: 'My Playlist', trackIds: [1, 2, 3] },
    ],
  }),
}));

// Mock the getFile utility
vi.mock('../../utils/db', () => ({
  getFile: vi.fn().mockResolvedValue({
    id: 'file1',
    data: new Blob([''], { type: 'audio/mpeg' }),
  }),
}));

describe('GlobalAudioPlayer', () => {
  it('should not play the same track consecutively when shuffle is enabled', () => {
    const { container } = render(<GlobalAudioPlayer />);
    const audio = container.querySelector('audio');

    for (let i = 0; i < 20; i++) {
        fireEvent.ended(audio);
        const newStateFn = mockSetMusicPlayerState.mock.calls[i][0];
        const oldState = { currentTrackId: 1 };
        const newState = newStateFn(oldState);
        expect(newState.currentTrackId).not.toBe(1);
    }
  });
});

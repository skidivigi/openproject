//-- copyright
// OpenProject is an open source project management software.
// Copyright (C) the OpenProject GmbH
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.
//
// See COPYRIGHT and LICENSE files for more details.
//++

import type { GridResource } from 'core-app/features/hal/resources/grid-resource';
import type { BoardCustomFilter } from './board';
import { Board } from './board';

describe('Board custom filters', () => {
  const customFilter:BoardCustomFilter = {
    id: 'urgent',
    name: 'Urgent work',
    filters: [{ priority: { operator: '=', values: ['1'] } }],
  };

  it('stores custom filter definitions in grid options', () => {
    const grid = { options: {} } as GridResource;
    const board = new Board(grid);

    board.customFilters = [customFilter];

    expect(board.customFilters).toEqual([customFilter]);
    expect(grid.options.customFilters).toEqual([customFilter]);
  });
});

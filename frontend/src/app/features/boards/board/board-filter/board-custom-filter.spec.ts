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

import type { ApiV3Filter, FilterOperator } from 'core-app/shared/helpers/api-v3/api-v3-filter-builder';
import { buildBoardCustomFilter } from './board-custom-filter';

describe('buildBoardCustomFilter', () => {
  const priorityFilter = (operator:FilterOperator = '='):ApiV3Filter => ({
    priority: { operator, values: ['2'] },
  });

  it('creates a named custom filter from the current board filters', () => {
    const filters = [priorityFilter()];

    expect(buildBoardCustomFilter('id-1', '  Urgent  ', filters)).toEqual({
      id: 'id-1',
      name: 'Urgent',
      filters,
    });
  });

  it('rejects a custom filter without a name', () => {
    expect(buildBoardCustomFilter(
      'id-1',
      '   ',
      [priorityFilter()],
    )).toBeUndefined();
  });

  it('rejects a custom filter without work package filters', () => {
    expect(buildBoardCustomFilter('id-1', 'Urgent', [])).toBeUndefined();
  });

  it('rejects an incomplete work package filter', () => {
    expect(buildBoardCustomFilter(
      'id-1',
      'Urgent',
      [priorityFilter('' as FilterOperator)],
    )).toBeUndefined();
  });

  it('keeps a snapshot of the filters that were saved', () => {
    const filters = [priorityFilter()];
    const customFilter = buildBoardCustomFilter('id-1', 'Urgent', filters);

    filters[0].priority.values.push('3');

    expect(customFilter?.filters).toEqual([
      { priority: { operator: '=', values: ['2'] } },
    ]);
  });
});

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

import type { ApiV3Filter } from 'core-app/shared/helpers/api-v3/api-v3-filter-builder';
import {
  composeBoardFilters,
  composeBoardListFilters,
} from './board-filter-composition';

describe('board filter composition', () => {
  const filter = (name:string, values:string[]):ApiV3Filter => ({
    [name]: { operator: '=', values },
  });

  it('combines base filters with active custom filters', () => {
    expect(composeBoardFilters(
      [filter('priority', ['1'])],
      [[filter('status', ['2'])], [filter('assignee', ['3'])]],
    )).toEqual([
      filter('priority', ['1']),
      filter('status', ['2']),
      filter('assignee', ['3']),
    ]);
  });

  it('lets the most recently activated custom filter replace the same field', () => {
    expect(composeBoardFilters(
      [filter('status', ['1'])],
      [[filter('status', ['2'])], [filter('status', ['3'])]],
    )).toEqual([filter('status', ['3'])]);
  });

  it('ignores structural and action filters from custom filters', () => {
    expect(composeBoardFilters(
      [filter('priority', ['1'])],
      [[filter('manualSort', []), filter('status', ['2']), filter('assignee', ['3'])]],
      ['status'],
    )).toEqual([
      filter('priority', ['1']),
      filter('assignee', ['3']),
    ]);
  });

  it('lets column structural filters override board filters', () => {
    expect(composeBoardListFilters(
      [filter('status', ['1']), filter('priority', ['2'])],
      [filter('status', ['3']), filter('manualSort', [])],
    )).toEqual([
      filter('status', ['3']),
      filter('priority', ['2']),
      filter('manualSort', []),
    ]);
  });
});

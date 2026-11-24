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

import type { BoardCustomFilter } from 'core-app/features/boards/board/board';
import type { ApiV3Filter } from 'core-app/shared/helpers/api-v3/api-v3-filter-builder';
import { BoardFiltersService } from './board-filters.service';

describe('BoardFiltersService', () => {
  const filter = (name:string, values:string[]):ApiV3Filter => ({
    [name]: { operator: '=', values },
  });
  const customFilter = (id:string, filters:ApiV3Filter[]):BoardCustomFilter => ({
    id,
    name: id,
    filters,
  });

  it('combines multiple active custom filters with the manual board filters', () => {
    const service = new BoardFiltersService();
    service.filters.putValue([filter('type', ['1'])]);
    service.initializeCustomFilters([
      customFilter('urgent', [filter('priority', ['2'])]),
      customFilter('mine', [filter('assignee', ['3'])]),
    ]);

    service.toggleCustomFilter('urgent');
    service.toggleCustomFilter('mine');

    expect(service.effectiveCurrent).toEqual([
      filter('type', ['1']),
      filter('priority', ['2']),
      filter('assignee', ['3']),
    ]);
  });

  it('registers a new custom filter and activates it', () => {
    const service = new BoardFiltersService();
    const urgent = customFilter('urgent', [filter('priority', ['2'])]);
    service.initializeCustomFilters([]);

    service.addCustomFilter(urgent);

    expect(service.currentCustomFilters).toEqual([urgent]);
    expect(service.isCustomFilterActive('urgent')).toBe(true);
    expect(service.effectiveCurrent).toEqual(urgent.filters);
  });

  it('removes a custom filter from the available and active filters', () => {
    const service = new BoardFiltersService();
    const urgent = customFilter('urgent', [filter('priority', ['2'])]);
    const mine = customFilter('mine', [filter('assignee', ['3'])]);
    service.initializeCustomFilters([urgent, mine]);
    service.toggleCustomFilter('urgent');
    service.toggleCustomFilter('mine');

    service.removeCustomFilter('urgent');

    expect(service.currentCustomFilters).toEqual([mine]);
    expect(service.isCustomFilterActive('urgent')).toBe(false);
    expect(service.isCustomFilterActive('mine')).toBe(true);
    expect(service.effectiveCurrent).toEqual(mine.filters);
  });
});

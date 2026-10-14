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

const STRUCTURAL_FILTERS = ['manualSort'];

export function filterName(filter:ApiV3Filter):string {
  return Object.keys(filter)[0];
}

export function composeBoardFilters(
  baseFilters:ApiV3Filter[],
  customFilterGroups:ApiV3Filter[][],
  protectedFilterNames:string[] = [],
):ApiV3Filter[] {
  const filtersByName = new Map(
    baseFilters.map((filter) => [filterName(filter), filter]),
  );
  const ignoredNames = new Set([...STRUCTURAL_FILTERS, ...protectedFilterNames]);

  customFilterGroups.flat().forEach((filter) => {
    const name = filterName(filter);
    if (!ignoredNames.has(name)) {
      filtersByName.set(name, filter);
    }
  });

  return Array.from(filtersByName.values());
}

export function composeBoardListFilters(
  boardFilters:ApiV3Filter[],
  columnFilters:ApiV3Filter[],
):ApiV3Filter[] {
  const filtersByName = new Map(
    boardFilters.map((filter) => [filterName(filter), filter]),
  );

  columnFilters.forEach((filter) => filtersByName.set(filterName(filter), filter));

  return Array.from(filtersByName.values());
}

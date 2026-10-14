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

export function buildBoardCustomFilter(
  id:string,
  name:string,
  filters:ApiV3Filter[],
):BoardCustomFilter | undefined {
  const trimmedName = name.trim();
  const filtersComplete = filters.every((filter) => (
    Object.keys(filter).length > 0
    && Object.values(filter).every(({ operator }) => Boolean(operator))
  ));
  if (!trimmedName || filters.length === 0 || !filtersComplete) {
    return undefined;
  }

  return {
    id,
    name: trimmedName,
    filters: structuredClone(filters),
  };
}

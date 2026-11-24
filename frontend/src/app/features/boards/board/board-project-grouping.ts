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

import { ApiV3Filter } from 'core-app/shared/helpers/api-v3/api-v3-filter-builder';
import { composeBoardListFilters } from './board-filter/board-filter-composition';

export interface BoardProjectGroup {
  id:string;
  identifier:string;
  name:string;
}

export function boardProjectGroups(
  current:BoardProjectGroup,
  descendants:BoardProjectGroup[],
):BoardProjectGroup[] {
  const descendantsById = new Map(
    descendants
      .filter((project) => project.id !== current.id)
      .map((project) => [project.id, project]),
  );

  return [
    current,
    ...Array.from(descendantsById.values()).sort((left, right) => left.name.localeCompare(right.name)),
  ];
}

export function boardProjectFilter(projectId:string, currentProjectId:string):ApiV3Filter {
  if (projectId === currentProjectId) {
    return {
      subprojectId: {
        operator: '!*',
        values: [],
      },
    };
  }

  return {
    onlySubproject: {
      operator: '=',
      values: [projectId],
    },
  };
}

export function boardProjectListFilters(
  boardFilters:ApiV3Filter[],
  listFilters:ApiV3Filter[],
  projectId?:string,
  currentProjectId?:string|null,
):ApiV3Filter[] {
  if (!projectId) {
    return composeBoardListFilters(boardFilters, listFilters);
  }

  const projectFilterNames = new Set(['project', 'subprojectId', 'onlySubproject']);
  const withoutProjectScope = (filters:ApiV3Filter[]) => filters.filter(
    (filter) => !projectFilterNames.has(Object.keys(filter)[0]),
  );

  return composeBoardListFilters(
    withoutProjectScope(boardFilters),
    [...withoutProjectScope(listFilters), boardProjectFilter(projectId, currentProjectId ?? projectId)],
  );
}

export function boardProjectQueryProps<T extends object>(props:T, projectId?:string):T|T & { includeSubprojects:boolean } {
  return projectId ? { ...props, includeSubprojects: true } : props;
}

export function boardProjectListId(queryId:string, projectId?:string):string {
  return projectId ? `board-${projectId}-${queryId}` : `board-${queryId}`;
}

export function filterBoardProjectGroups(
  groups:BoardProjectGroup[],
  filters:ApiV3Filter[],
):BoardProjectGroup[] {
  const projectFilterNames = new Set(['project', 'subprojectId', 'onlySubproject']);
  const restrictions = filters.flatMap((filter) => (
    Object.entries(filter)
      .filter(([name, value]) => projectFilterNames.has(name) && value.operator === '=')
      .map(([, value]) => new Set(value.values.map((item) => String(item).split('/').pop()!)))
  ));

  if (restrictions.length === 0) {
    return groups;
  }

  return groups.filter((project) => restrictions.every((ids) => ids.has(project.id)));
}

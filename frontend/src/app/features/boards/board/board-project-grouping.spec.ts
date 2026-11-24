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

import {
  boardProjectFilter,
  boardProjectGroups,
  boardProjectListFilters,
  boardProjectListId,
  boardProjectQueryProps,
  filterBoardProjectGroups,
} from './board-project-grouping';

describe('board project grouping', () => {
  it('keeps the current project first and removes duplicate descendants', () => {
    const current = { id: '1', identifier: 'parent', name: 'Parent' };
    const descendants = [
      { id: '3', identifier: 'zeta', name: 'Zeta' },
      { id: '1', identifier: 'parent', name: 'Parent' },
      { id: '2', identifier: 'alpha', name: 'Alpha' },
    ];

    expect(boardProjectGroups(current, descendants)).toEqual([
      current,
      descendants[2],
      descendants[0],
    ]);
  });

  it('builds a current-project-only filter for the parent swimlane', () => {
    expect(boardProjectFilter('1', '1')).toEqual({
      subprojectId: { operator: '!*', values: [] },
    });
  });

  it('builds an exact subproject filter for a child swimlane', () => {
    expect(boardProjectFilter('42', '1')).toEqual({
      onlySubproject: { operator: '=', values: ['42'] },
    });
  });

  it('adds the swimlane project without replacing column membership filters', () => {
    expect(boardProjectListFilters(
      [{ priority: { operator: '=', values: ['1'] } }],
      [{ status: { operator: '=', values: ['2'] } }],
      '42',
      '1',
    )).toEqual([
      { priority: { operator: '=', values: ['1'] } },
      { status: { operator: '=', values: ['2'] } },
      boardProjectFilter('42', '1'),
    ]);
  });

  it('replaces inherited project scope filters for a project swimlane', () => {
    expect(boardProjectListFilters(
      [
        { project: { operator: '=', values: ['1'] } },
        { subprojectId: { operator: '=', values: ['2'] } },
        { priority: { operator: '=', values: ['3'] } },
      ],
      [
        { onlySubproject: { operator: '=', values: ['4'] } },
        { status: { operator: '=', values: ['5'] } },
      ],
      '42',
      '1',
    )).toEqual([
      { priority: { operator: '=', values: ['3'] } },
      { status: { operator: '=', values: ['5'] } },
      boardProjectFilter('42', '1'),
    ]);
  });

  it('keeps the legacy query parameters unchanged without project grouping', () => {
    const props = { pageSize: 500, showHierarchies: false };

    expect(boardProjectQueryProps(props)).toBe(props);
  });

  it('includes subprojects when loading a project swimlane', () => {
    expect(boardProjectQueryProps({ pageSize: 500 }, '42')).toEqual({
      pageSize: 500,
      includeSubprojects: true,
    });
  });

  it('uses a project-specific sortable list id for grouped boards', () => {
    expect(boardProjectListId('7', '42')).toBe('board-42-7');
    expect(boardProjectListId('7')).toBe('board-7');
  });

  it('shows only project swimlanes allowed by active project filters', () => {
    const groups = [
      { id: '1', identifier: 'parent', name: 'Parent' },
      { id: '2', identifier: 'alpha', name: 'Alpha' },
      { id: '3', identifier: 'zeta', name: 'Zeta' },
    ];

    expect(filterBoardProjectGroups(groups, [
      { subprojectId: { operator: '=', values: ['/api/v3/projects/2', '3'] } },
    ])).toEqual([groups[1], groups[2]]);
  });
});

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

import { Injectable } from '@angular/core';
import { input } from '@openproject/reactivestates';
import type { BoardCustomFilter } from 'core-app/features/boards/board/board';
import type { ApiV3Filter } from 'core-app/shared/helpers/api-v3/api-v3-filter-builder';
import { composeBoardFilters } from './board-filter-composition';

@Injectable()
export class BoardFiltersService {
  readonly filters = input<ApiV3Filter[]>([]);

  readonly effectiveFilters = input<ApiV3Filter[]>([]);

  readonly customFilters = input<BoardCustomFilter[]>([]);

  readonly activeCustomFilterIds = input<string[]>([]);

  private protectedFilterNames:string[] = [];

  constructor() {
    this.filters.values$().subscribe(() => this.updateEffectiveFilters());
  }

  get current():ApiV3Filter[] {
    return this.filters.getValueOr([]);
  }

  get effectiveCurrent():ApiV3Filter[] {
    return this.effectiveFilters.getValueOr([]);
  }

  get currentCustomFilters():BoardCustomFilter[] {
    return this.customFilters.getValueOr([]);
  }

  initializeCustomFilters(
    customFilters:BoardCustomFilter[],
    protectedFilterNames:string[] = [],
  ):void {
    this.customFilters.putValue(customFilters);
    this.activeCustomFilterIds.putValue([]);
    this.protectedFilterNames = protectedFilterNames;
    this.updateEffectiveFilters();
  }

  addCustomFilter(customFilter:BoardCustomFilter, activate = true):void {
    this.customFilters.putValue([...this.currentCustomFilters, customFilter]);

    if (activate) {
      this.activeCustomFilterIds.putValue([
        ...this.activeCustomFilterIds.getValueOr([] as string[]),
        customFilter.id,
      ]);
    }

    this.updateEffectiveFilters();
  }

  removeCustomFilter(id:string):void {
    this.customFilters.putValue(
      this.currentCustomFilters.filter((customFilter) => customFilter.id !== id),
    );
    this.activeCustomFilterIds.putValue(
      this.activeCustomFilterIds.getValueOr([] as string[]).filter((activeId) => activeId !== id),
    );
    this.updateEffectiveFilters();
  }

  toggleCustomFilter(id:string):void {
    const activeIds = this.activeCustomFilterIds.getValueOr([] as string[]);
    this.activeCustomFilterIds.putValue(
      activeIds.includes(id)
        ? activeIds.filter((activeId) => activeId !== id)
        : [...activeIds, id],
    );
    this.updateEffectiveFilters();
  }

  isCustomFilterActive(id:string):boolean {
    return this.activeCustomFilterIds.getValueOr([] as string[]).includes(id);
  }

  private updateEffectiveFilters():void {
    const customFiltersById = new Map(this.currentCustomFilters.map((filter) => [filter.id, filter]));
    const activeFilterGroups = this.activeCustomFilterIds
      .getValueOr([])
      .flatMap((id) => {
        const customFilter = customFiltersById.get(id);
        return customFilter ? [customFilter.filters] : [];
      });

    this.effectiveFilters.putValue(composeBoardFilters(
      this.current,
      activeFilterGroups,
      this.protectedFilterNames,
    ));
  }
}

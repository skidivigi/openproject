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

import { AfterViewInit, ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Board } from 'core-app/features/boards/board/board';
import { CurrentProjectService } from 'core-app/core/current-project/current-project.service';
import { WorkPackageStatesInitializationService } from 'core-app/features/work-packages/components/wp-list/wp-states-initialization.service';
import { IsolatedQuerySpace } from 'core-app/features/work-packages/directives/query-space/isolated-query-space';
import { HalResourceService } from 'core-app/features/hal/services/hal-resource.service';
import { WorkPackageViewFiltersService } from 'core-app/features/work-packages/routing/wp-view-base/view-services/wp-view-filters.service';
import { QueryFilterInstanceResource } from 'core-app/features/hal/resources/query-filter-instance-resource';
import { UrlParamsHelperService } from 'core-app/features/work-packages/components/wp-query/url-params-helper';
import { debounceTime, finalize, skip, take } from 'rxjs/operators';
import { UntilDestroyedMixin } from 'core-app/shared/helpers/angular/until-destroyed.mixin';
import { Observable } from 'rxjs';
import { BoardFiltersService } from 'core-app/features/boards/board/board-filter/board-filters.service';
import { BoardActionsRegistryService } from 'core-app/features/boards/board/board-actions/board-actions-registry.service';
import { ApiV3Service } from 'core-app/core/apiv3/api-v3.service';
import * as Turbo from '@hotwired/turbo';
import { v4 as uuidv4 } from 'uuid';
import { I18nService } from 'core-app/core/i18n/i18n.service';
import { buildBoardCustomFilter } from 'core-app/features/boards/board/board-filter/board-custom-filter';
import { BoardService } from 'core-app/features/boards/board/board.service';
import { HalResourceNotificationService } from 'core-app/features/hal/services/hal-resource-notification.service';
import { ToastService } from 'core-app/shared/components/toaster/toast.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'board-filter',
  templateUrl: './board-filter.component.html',
  styleUrls: ['./board-filter.component.sass'],
  standalone: false,
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class BoardFilterComponent extends UntilDestroyedMixin implements AfterViewInit {
  private readonly currentProjectService = inject(CurrentProjectService);
  private readonly querySpace = inject(IsolatedQuerySpace);
  private readonly apiV3Service = inject(ApiV3Service);
  private readonly halResourceService = inject(HalResourceService);
  private readonly wpStatesInitialization = inject(WorkPackageStatesInitializationService);
  private readonly wpTableFilters = inject(WorkPackageViewFiltersService);
  private readonly urlParamsHelper = inject(UrlParamsHelperService);
  private readonly boardFilters = inject(BoardFiltersService);
  private readonly boardActionRegistry = inject(BoardActionsRegistryService);
  private readonly boards = inject(BoardService);
  private readonly halNotification = inject(HalResourceNotificationService);
  private readonly toastService = inject(ToastService);
  private readonly I18n = inject(I18nService);

  /** Current active */
  @Input() public board$:Observable<Board>;

  initialized = false;

  board?:Board;

  customFilterName = '';

  savingCustomFilter = false;

  readonly text = {
    name: this.I18n.t('js.boards.custom_filters.name'),
    save: this.I18n.t('js.boards.custom_filters.save'),
    createSuccessful: this.I18n.t('js.notice_successful_create'),
  };

  ngAfterViewInit():void {
    if (!this.board$) {
      return;
    }

    this.board$
      .pipe(take(1))
      .subscribe((board) => {
        this.board = board;

        // Initially load the form once to be able to render filters
        this.loadQueryForm();

        // Update checksum service whenever filters change
        this.updateChecksumOnFilterChanges();

        // Remove action attribute from filter service, under every
        // filter id the action filter may be rendered as
        if (board.isAction) {
          this.wpTableFilters.hidden.push(...this.boardActionRegistry.get(board.actionAttribute!).filterNames);
        }
      });
  }

  private updateChecksumOnFilterChanges() {
    this.wpTableFilters
      .live$()
      .pipe(
        this.untilDestroyed(),
        skip(1),
        debounceTime(250),
      )
      .subscribe(() => {
        const filters:QueryFilterInstanceResource[] = this.wpTableFilters.current;
        const filterHash = this.urlParamsHelper.buildV3GetFilters(filters);
        const query_props = JSON.stringify(filterHash);

        const url = new URL(window.location.href);
        if (query_props) {
          url.searchParams.set('query_props', query_props);
        } else {
          url.searchParams.delete('query_props');
        }
        Turbo.session.history.push(url);

        this.boardFilters.filters.putValue(filterHash);
      });
  }

  get customFilterSaveDisabled():boolean {
    return this.savingCustomFilter
      || !this.customFilterName.trim()
      || this.boardFilters.current.length === 0;
  }

  saveCustomFilter(event:Event):void {
    event.preventDefault();

    const board = this.board;
    const customFilter = buildBoardCustomFilter(
      uuidv4(),
      this.customFilterName,
      this.boardFilters.current,
    );
    if (!board || !customFilter) {
      return;
    }

    const previousCustomFilters = this.boardFilters.currentCustomFilters;
    const previousBoardFilters = board.filters;
    board.customFilters = [...previousCustomFilters, customFilter];
    board.filters = [];
    this.savingCustomFilter = true;

    this.boards.save(board)
      .pipe(finalize(() => {
        this.savingCustomFilter = false;
      }))
      .subscribe({
        next: (savedBoard) => {
          this.board = savedBoard;
          this.boardFilters.addCustomFilter(customFilter);
          this.wpTableFilters.update([]);
          this.customFilterName = '';
          this.toastService.addSuccess(this.text.createSuccessful);
        },
        error: (error) => {
          board.customFilters = previousCustomFilters;
          board.filters = previousBoardFilters;
          this.halNotification.handleRawError(error);
        },
      });
  }

  private loadQueryForm() {
    this
      .apiV3Service
      .queries
      .form
      .loadWithParams(
        { filters: JSON.stringify(this.boardFilters.current) },
        undefined,
        this.currentProjectService.id,
      )
      .subscribe(([form, query]) => {
        this.querySpace.query.putValue(query);
        this.wpStatesInitialization.updateStatesFromForm(query, form);
      });
  }
}

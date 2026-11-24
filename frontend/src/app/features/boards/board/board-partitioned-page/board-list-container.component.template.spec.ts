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

/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('board list container template', () => {
  const template = readFileSync(
    fileURLToPath(new URL('./board-list-container.component.html', import.meta.url)),
    'utf8',
  );

  it('renders board lists directly in both legacy and grouped modes', () => {
    expect(template).not.toContain('ngTemplateOutlet');
    expect(template).toContain('[project]="project"');

    const legacyBranch = template.split('} @else {')[1];
    expect(legacyBranch).toContain('<board-list');
    expect(legacyBranch).not.toContain('[project]="project"');
  });
});

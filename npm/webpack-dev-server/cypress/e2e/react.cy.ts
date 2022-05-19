/// <reference types="cypress" />
/// <reference path="../support/e2e.ts" />
import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const WEBPACK_REACT: ProjectDirs[number][] = ['webpack4_wds3-react', 'webpack4_wds4-react', 'webpack5_wds3-react', 'webpack5_wds4-react']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectDirs[number][] = []

for (const project of WEBPACK_REACT) {
  if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
    continue
  }

  describe(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project, ['--config-file', 'cypress-webpack.config.ts'])
      cy.startAppServer('component')
    })

    it('should mount a passing test', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.removeFileInProject(`src/AppCompilationError.cy.jsx`)
      })

      cy.visitApp()
      cy.contains('App.cy.jsx').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)
    })

    it('MissingReact: should fail, rerun, succeed', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.contains('MissingReact.cy.jsx').click()
      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 1)
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(`src/MissingReact.jsx`,
        `import React from 'react';
        ${await ctx.file.readFileInProject('src/MissingReact.jsx')}`)
      })

      cy.get('.passed > .num').should('contain', 1)
    })

    it('MissingReactInSpec: should fail, rerun, succeed', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.contains('MissingReactInSpec.cy.jsx').click()
      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 1)
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(`src/MissingReactInSpec.cy.jsx`,
          await ctx.file.readFileInProject('src/App.cy.jsx'))
      })

      cy.get('.passed > .num').should('contain', 1)
    })

    it('AppCompilationError: should fail with uncaught exception error', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.contains('AppCompilationError.cy.jsx').click()
      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 1)
      cy.contains('An uncaught error was detected outside of a test')
      cy.contains('The following error originated from your test code, not from Cypress.')
    })
  })
}
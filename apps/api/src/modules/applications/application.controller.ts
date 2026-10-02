import type { Request, Response } from "express";
import {
  addNoteInputSchema,
  applicationResponseSchema,
  applicationsResponseSchema,
  createApplicationInputSchema,
  idParamSchema,
  noteIdParamSchema,
  noteResponseSchema,
  reorderApplicationsInputSchema,
  updateApplicationInputSchema,
} from "@trackr/shared";

import { ApplicationService } from "./application.service.js";
import { ApplicationRepository } from "./application.repository.js";
import { parseBody, parseParams } from "../../utils/validation.js";

export class ApplicationController {
  constructor(
    private applicationService: ApplicationService = new ApplicationService(
      new ApplicationRepository(),
    ),
  ) {}

  list = async (req: Request, res: Response) => {
    const applications = await this.applicationService.list(req.user!.id);
    res.json(applicationsResponseSchema.parse({ applications }));
  };

  get = async (req: Request, res: Response) => {
    const params = parseParams(idParamSchema, req, res);
    if (!params) {
      return;
    }
    const { id } = params;

    const application = await this.applicationService.get(req.user!.id, id);
    res.json(applicationResponseSchema.parse({ application }));
  };

  create = async (req: Request, res: Response) => {
    const input = parseBody(createApplicationInputSchema, req, res);
    if (!input) {
      return;
    }

    const application = await this.applicationService.create(
      req.user!.id,
      input,
    );
    res.status(201).json(applicationResponseSchema.parse({ application }));
  };

  update = async (req: Request, res: Response) => {
    const params = parseParams(idParamSchema, req, res);
    if (!params) {
      return;
    }
    const { id } = params;

    const input = parseBody(updateApplicationInputSchema, req, res);
    if (!input) {
      return;
    }

    const application = await this.applicationService.update(
      req.user!.id,
      id,
      input,
    );
    res.json(applicationResponseSchema.parse({ application }));
  };

  remove = async (req: Request, res: Response) => {
    const params = parseParams(idParamSchema, req, res);
    if (!params) {
      return;
    }
    const { id } = params;

    await this.applicationService.remove(req.user!.id, id);
    res.status(204).send();
  };

  /**
   * A drop sends the whole board and gets the whole board back, so the client
   * ends up holding exactly what the database decided rather than assuming its
   * optimistic guess was right.
   */
  reorder = async (req: Request, res: Response) => {
    const input = parseBody(reorderApplicationsInputSchema, req, res);
    if (!input) {
      return;
    }

    const applications = await this.applicationService.reorder(
      req.user!.id,
      input,
    );
    res.json(applicationsResponseSchema.parse({ applications }));
  };

  addNote = async (req: Request, res: Response) => {
    const params = parseParams(idParamSchema, req, res);
    if (!params) {
      return;
    }
    const { id } = params;

    const input = parseBody(addNoteInputSchema, req, res);
    if (!input) {
      return;
    }

    const note = await this.applicationService.addNote(req.user!.id, id, input);
    res.status(201).json(noteResponseSchema.parse({ note }));
  };

  removeNote = async (req: Request, res: Response) => {
    const params = parseParams(noteIdParamSchema, req, res);
    if (!params) {
      return;
    }
    const { id, noteId } = params;

    await this.applicationService.removeNote(req.user!.id, id, noteId);
    res.status(204).send();
  };
}

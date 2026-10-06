import type { Request, Response } from "express";
import {
  addNoteInputSchema,
  applicationResponseSchema,
  applicationsResponseSchema,
  columnLabelsResponseSchema,
  createApplicationInputSchema,
  idParamSchema,
  noteIdParamSchema,
  noteResponseSchema,
  reorderApplicationsInputSchema,
  updateApplicationInputSchema,
  updateColumnLabelsInputSchema,
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

  uploadCv = async (req: Request, res: Response) => {
    const params = parseParams(idParamSchema, req, res);
    if (!params) {
      return;
    }
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      res.status(400).json({ message: "Attach a CV file as 'cv'" });
      return;
    }

    const allowed = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/rtf",
      "application/rtf",
    ]);
    if (!allowed.has(file.mimetype)) {
      res.status(400).json({
        message: "CV must be PDF, Word, TXT, or RTF",
      });
      return;
    }

    const application = await this.applicationService.saveCv(
      req.user!.id,
      params.id,
      {
        originalName: file.originalname.slice(0, 255),
        mime: file.mimetype,
        size: file.size,
        dataBase64: file.buffer.toString("base64"),
      },
    );
    res.json(applicationResponseSchema.parse({ application }));
  };

  downloadCv = async (req: Request, res: Response) => {
    const params = parseParams(idParamSchema, req, res);
    if (!params) {
      return;
    }
    const cv = await this.applicationService.getCv(req.user!.id, params.id);
    res.setHeader("Content-Type", cv.mime);
    res.setHeader("Content-Length", String(cv.data.length));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${cv.fileName.replace(/"/g, "")}"`,
    );
    res.send(cv.data);
  };

  deleteCv = async (req: Request, res: Response) => {
    const params = parseParams(idParamSchema, req, res);
    if (!params) {
      return;
    }
    const application = await this.applicationService.removeCv(
      req.user!.id,
      params.id,
    );
    res.json(applicationResponseSchema.parse({ application }));
  };

  getColumnLabels = async (req: Request, res: Response) => {
    const labels = await this.applicationService.getColumnLabels(req.user!.id);
    res.json(columnLabelsResponseSchema.parse({ labels }));
  };

  updateColumnLabels = async (req: Request, res: Response) => {
    const input = parseBody(updateColumnLabelsInputSchema, req, res);
    if (!input) {
      return;
    }
    const labels = await this.applicationService.setColumnLabels(
      req.user!.id,
      input.labels,
    );
    res.json(columnLabelsResponseSchema.parse({ labels }));
  };
}

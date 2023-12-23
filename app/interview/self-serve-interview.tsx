import React, { useState, useRef, useEffect, use } from "react";
import _ from "lodash";
import { useNavigate } from "react-router-dom";
import { useAppConfig, useChatStore } from "../store";

import styles_chat from "../components/chat.module.scss";
import styles_tm from "../toastmasters/toastmasters.module.scss";
import { List, ListItem, showPrompt, showToast } from "../components/ui-lib";
import { IconButton } from "../components/button";
import SendWhiteIcon from "../icons/send-white.svg";

import {
  InputSubmitStatus,
  ToastmastersRoles,
  speakersTimeRecord,
} from "../toastmasters/roles";

import {
  InterviewSelfServeFinalGuidance as InterviewGuidance,
  InterviewSelfServeRecord as InterviewRecord,
} from "./roles";

import {
  ChatTitle,
  ChatInput,
  ChatResponse,
  ChatUtility,
  ChatSubmitRadiobox,
  BorderLine,
} from "../toastmasters/chat-common";
import { InputTableRow } from "../store/chat";

import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import MenuIcon from "../icons/menu.svg";

import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButtonMui from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { EN_MASKS } from "../masks/en";
import { Mask } from "../store/mask";
import { useScrollToBottom } from "../components/chat";
import { MuiCollapse, MuiStepper } from "../toastmasters/chat-common-mui";
import {
  InterviewActions,
  InterviewJobDescriptions,
  InterviewSelfServeGuidance,
} from "./roles";

export function Chat() {
  const chatStore = useChatStore();
  const [session, sessionIndex] = useChatStore((state) => [
    state.currentSession(),
    state.currentSessionIndex,
  ]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 设置自动滑动窗口
  const { scrollRef, setAutoScroll, scrollToBottom } = useScrollToBottom();
  const [hitBottom, setHitBottom] = useState(true);

  // TODO: save selected job
  const config = useAppConfig();
  const [jobDescription, setJobDescription] = useState("");

  const checkInput = (): InputSubmitStatus => {
    if (session.input.datas.length === 0) {
      showToast(`Input Table is empty, please check`);
      return new InputSubmitStatus(false, "");
    }

    const isAllValid = session.input.datas.every((row) => {
      let question = row.question.text.trim();
      let speech = row.speech.text.trim();
      if (question === "" || speech === "") {
        showToast(`${row.speaker}: Question or Speech is empty, please check`);
        return false;
      }
      return true;
    });

    if (!isAllValid) {
      return new InputSubmitStatus(false, "");
    }

    var guidance = InterviewGuidance(getInputsString());
    return new InputSubmitStatus(true, guidance);
  };

  const getInputsString = (): string => {
    // inputTable
    const speakerInputs = session.input.datas?.map((row) => ({
      Number: row.speaker,
      Question: row.question.text,
      Answer: row.speech.text,
    }));
    // 4 是可选的缩进参数，它表示每一层嵌套的缩进空格数
    const speakerInputsString = JSON.stringify(speakerInputs, null, 4);
    return speakerInputsString;
  };

  const addItem = async () => {
    setAutoScroll(false);

    if (jobDescription == "") {
      showToast("JobDescription can not be empty");
      return;
    }

    //  Get Response from GPT
    let ask = "";
    const length = session.input.datas.length;
    if (length == 0) {
      ask = `This is Job Description:
      {
      ${jobDescription}
      }

      ${InterviewActions.NextQuestion}.  Note: only question itself, no more extra words.
      `;
    } else {
      const lastResponse = session.input.datas[length - 1].speech.text;
      ask = `
      {
      ${lastResponse}
      }
      
      ${InterviewActions.NextQuestion}.  Note: only question itself, no more extra words.
      `;
    }

    // TODO
    // reset status from 0
    // chatStore.resetSessionFromIndex(2 + length);

    chatStore.onUserInput(ask, "Guidance");
    await chatStore.getIsFinished();

    const newItem = new InputTableRow();
    newItem.speaker = `Question${session.input.datas.length + 1}`;

    // TODO: More settings
    const selectRole = "TableTopicsSpeaker(1-2min)";
    newItem.speech.role = selectRole.split("(")[0]; // only keep prefix
    newItem.speech.timeExpect = speakersTimeRecord[selectRole];
    newItem.question.text =
      session.messages[session.messages.length - 1].content;

    var newInputBlocks = [...session.input.datas, newItem];
    chatStore.updateCurrentSession(
      (session) => (
        (session.input.datas = newInputBlocks), (session.input.activeStep = 1)
      ),
    );
  };

  return (
    <div className={styles_chat.chat} key={session.id}>
      <ChatTitle getInputsString={getInputsString}></ChatTitle>
      <div
        className={styles_chat["chat-body"]}
        ref={scrollRef}
        onMouseDown={() => inputRef.current?.blur()}
        // onWheel={(e) => setAutoScroll(hitBottom && e.deltaY > 0)}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        {/* <MuiCollapse title="Introduction">
          <Typography
            sx={{ mt: 1, mb: 1, marginLeft: "40px", marginBottom: "20px" }}
          >
            This page is to evaluate the impromptu speeches given by Table
            Topics Speakers.
            <br />
            Here is the general flow.
          </Typography>
          <MuiStepper
            steps={[
              "Add Speaker",
              "Select Evaluator",
              "Generate Evaluation",
              "Display Evaluation",
            ]}
            activeStep={session.input.activeStep}
          />
        </MuiCollapse> */}

        <MuiCollapse title="Select a job">
          <List>
            <ListItem title="Select a job">
              {Object.entries(InterviewJobDescriptions).map(
                ([jobTitle, jobDescription]) => {
                  return (
                    <Button
                      key={jobTitle}
                      variant="outlined"
                      onClick={() => {
                        setJobDescription(jobDescription);
                      }}
                      style={{
                        textTransform: "none",
                      }}
                    >
                      {jobTitle}
                    </Button>
                  );
                },
              )}
            </ListItem>
            <ListItem title="Job Description">
              <textarea
                ref={inputRef}
                className={styles_chat["chat-input"]}
                placeholder={"Enter To wrap"}
                onInput={(e) => setJobDescription(e.currentTarget.value)}
                value={jobDescription}
                rows={10}
                style={{
                  fontSize: config.fontSize,
                }}
              />
            </ListItem>
          </List>
        </MuiCollapse>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addItem}
          style={{
            textTransform: "none",
            marginLeft: "40px",
            marginBottom: "10px",
            marginTop: "10px",
          }}
        >
          {"Add Question"}
        </Button>
        {session.input.activeStep >= 1 && (
          <div style={{ padding: "0px 40px" }}>
            <ChatTable />
          </div>
        )}

        {session.input.activeStep >= 1 && (
          <ChatSubmitRadiobox
            toastmastersRecord={InterviewRecord}
            checkInput={checkInput}
            updateAutoScroll={setAutoScroll}
          />
        )}

        {session.input.activeStep >= 3 && (
          <ChatResponse
            scrollRef={scrollRef}
            toastmastersRecord={InterviewRecord}
          />
        )}
      </div>
    </div>
  );
}

function ChatTable() {
  const chatStore = useChatStore();
  const [session, sessionIndex] = useChatStore((state) => [
    state.currentSession(),
    state.currentSessionIndex,
  ]);

  // TODO: deleteItem执行时, speakerInputsString 并未及时变化, 导致Export结果又不对
  // 此时需要刷新页面, 才能看到正确的结果
  const deleteItem = (row_index: number) => {
    chatStore.updateCurrentSession(
      (session) => (
        session.input.datas.splice(row_index, 1),
        // TODO: add reset method into session.input
        row_index == 0
          ? ((session.input.activeStep = 0), (session.input.roles = []))
          : null
      ),
    );
  };

  const renameSpeaker = (row: InputTableRow) => {
    showPrompt("Rename", row.speaker).then((newName) => {
      if (newName && newName !== row.speaker) {
        chatStore.updateCurrentSession((session) => (row.speaker = newName));
      }
    });
  };

  function Row(props: { row: InputTableRow; row_index: number }) {
    const { row, row_index } = props;
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();

    // const onDetailClick = () => {
    //   const mask = EN_MASKS.find(
    //     (mask) => mask.name === ToastmastersRoles.ImpromptuSpeechEvaluator,
    //   ) as Mask;

    //   chatStore.newSession(mask);
    //   navigate(mask.pagePath as any);

    //   // new session has index 0
    //   chatStore.updateSession(0, (session) => {
    //     session.topic =
    //       ToastmastersRoles.ImpromptuSpeechEvaluator + "-" + row.speaker;
    //     session.input.data.question = { ...row.question };
    //     session.input.data.speech = { ...row.speech };
    //     return session;
    //   });
    // };

    return (
      <React.Fragment>
        <TableRow
          sx={{ "& > *": { borderBottom: "unset" } }}
          onClick={() => setOpen(!open)}
        >
          <TableCell>
            <IconButtonMui
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButtonMui>
          </TableCell>
          <TableCell component="th" scope="row">
            <div
              className={`${styles_tm["chat-input-speaker"]}`}
              onClickCapture={() => {
                renameSpeaker(row);
              }}
            >
              {row.speaker}
            </div>
          </TableCell>
          <TableCell align="left">
            {ChatUtility.getFirstNWords(row.question.text, 10)}
          </TableCell>
          <TableCell align="left">
            {ChatUtility.getFirstNWords(row.speech.text, 10)}
          </TableCell>
          <TableCell align="left">
            {ChatUtility.formatTime(row.speech.time)}
          </TableCell>
          {/* <TableCell align="left">
            <div className={styles_tm["table-actions"]}>
              <IconButton icon={<MenuIcon />} onClick={onDetailClick} />
              <IconButton
                icon={<CloseIcon />}
                onClick={() => deleteItem(row_index)}
              />
            </div>
          </TableCell> */}
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <List>
                  <ChatInput title="Question" inputStore={row.question} />
                  <ChatInput
                    title="Speech(1-2min)"
                    inputStore={row.speech}
                    showTime={true}
                  />
                </List>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table
        aria-label="collapsible table"
        className={styles_tm["table-border"]}
      >
        <TableHead>
          <TableRow>
            <TableCell style={{ width: "10px" }} />
            <TableCell
              align="left"
              className={styles_tm["table-header"]}
              style={{ width: "100px" }}
            >
              Speaker
            </TableCell>
            <TableCell align="left" className={styles_tm["table-header"]}>
              Question
            </TableCell>
            <TableCell align="left" className={styles_tm["table-header"]}>
              Speech
            </TableCell>
            <TableCell
              align="left"
              className={styles_tm["table-header"]}
              style={{ width: "10px" }}
            >
              SpeechTime
            </TableCell>
            {/* <TableCell
              align="left"
              className={styles_tm["table-header"]}
              style={{ width: "100px" }}
            >
              Action
            </TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {session.input.datas.map((row, index) => (
            <Row key={index} row={row} row_index={index} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
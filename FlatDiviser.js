// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchFlatDiviser.js - Released 2023/09/09 16:24:26 UTC
// ----------------------------------------------------------------------------
//
// This file is part of BatchFlatDiviser Script version 0.1.0
//
// Copyright (c) 2023 Hugues Obolonsky - HoxCa
//
// Based on BatchFormatConversion.js
// Copyright (c) 2009-2013 Pleiades Astrophoto S.L.
// Written by Juan Conejero (PTeam)
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ----------------------------------------------------------------------------

/*
 * BatchFlatDiviser v0.1.0
 *
 * A batch to anihilate residual bulk image artifact from lights frames.
 *
 * This script allows you to define a set of input lights frames, an image
 * of the synthetic flat to divide, a mask of the flat image aera,
 * an optional output directory, and output file and sample formats.
 * The script then iterates reading each input light frame, applying linear fits
 * to the synthetic flat image for this light frame and then perform a division
 * of this synthetic flat to the light frame before saving the corrected frame
 * to the output directory with the specified output file format.
 *
 * Copyright (C) 2023 Hugues Obolonsky - HoxCa
 */

#feature-id    BatchFlatDiviser : Batch Processing > BatchFlatDiviser

#feature-info  A batch residual bulk image eraser utility.<br/>\
   <br/> \
   This script allows you to define a set of input lights frames, an image \
   of the synthetic flat to divide, a mask of the flat image aera,\
   an optional output directory, and output file and sample formats.\
   <br>\
   <br>\
   The script then iterates reading each input light frame, applying linear fits \
   to the synthetic flat image for this light frame and then perform a division \
   of this synthetic flat to the light frame before saving the corrected frame \
   to the output directory with the specified output file format.\
   <br>\
   Copyright &copy; 2023 Hugues Obolonsky - HoxCa.

#feature-icon  BatchFlatDiviser.xpm

#include <pjsr/ColorSpace.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

#define DEFAULT_OUTPUT_EXTENSION ".xisf"
#define WARN_ON_NO_OUTPUT_DIRECTORY 0

#define VERSION "0.1.0"
#define TITLE   "BatchFlatDiviser"

#include "lib/gui_interface.js"
#include "lib/linearfit.js"
#include "lib/pixelmath_utils.js"
#include "lib/stf.js"
#include "lib/fileutils.js"

/*
 * Batch Format Conversion engine
 */

function uniqueViewIdNoLeadingZero(baseId) {
   var id = baseId;
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId + format("%d", i);
   }
   return id;
}


function FlatImageDiviserEngine()
{

   this.inputFiles = new Array;
   this.syntheticFlatImageName = "/Users/hugh/projects/astro/PixInsight/BatchFlatDiviser/img/rbi/RBI_ONLY_L.xisf";
   this.flatMaskImageName = "/Users/hugh/projects/astro/PixInsight/BatchFlatDiviser/img/rbi/RBI_MASK.xisf";
   this.syntheticFlatImageWindow = null;
   this.outputDirectory = "";
   this.outputPrefix = "";
   this.outputPostfix = "_x";
   this.outputExtension = DEFAULT_OUTPUT_EXTENSION;
   this.overwriteExisting = false;
   this.outputFormat = null;
   this.showImages = true;
   var frameImageWindow = null;


   this.loadFlatImage = function() {
      try
      {
         this.syntheticFlatImageWindow = fileutils.readImage(this.syntheticFlatImageName);
         this.syntheticFlatImageView = this.syntheticFlatImageWindow.mainView;
      }
      catch ( error )
      {
         console.writeln( error.message );
         console.writeln( error.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n'));

         (new MessageBox( error.message + " Continue?", TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
      }
   };
   this.freeFlatImage = function() {
      try
      {
         this.syntheticFlatImageView = null;
         if ( this.syntheticFlatImageWindow != null )
         {
            this.syntheticFlatImageWindow.purge();
            this.syntheticFlatImageWindow.close();
         }
         this.syntheticFlatImageWindow  = null;
      }
      catch ( error )
      {
         (new MessageBox( error.message, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
      }
   };

   this.loadFlatMask = function() {
      try
      {
         this.flatMaskImageWindow = fileutils.readImage(this.flatMaskImageName);
         this.flatMaskImageView = this.flatMaskImageWindow.mainView;
      }
      catch ( error )
      {
         console.writeln( error.message );
         console.writeln( error.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n'));

         (new MessageBox( error.message + " Continue?", TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
      }
   };

   this.freeRbiMask = function() {
      try
      {
         this.flatMaskImageView = null;
         if ( this.flatMaskImageWindow != null )
         {
            this.flatMaskImageWindow.purge();
            this.flatMaskImageWindow.forceClose();
         }
         this.flatMaskImageWindow  = null;
      }
      catch ( error )
      {
         (new MessageBox( error.message, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
      }
   };

   this.processingFlatDivision = function() {

   try {
      this.loadFlatImage();
      if (this.syntheticFlatImageView == null)
      {
         throw new Error("Unable to read the flat refence file, cannot continue.");
      }
      this.syntheticFlatImage = this.syntheticFlatImageView.image;

      this.loadFlatMask();
      if (this.flatMaskImageView == null)
      {
         throw new Error("Unable to read the flat mask file, cannot continue.");
      }

      // apply convolution to mask
      this.flatMaskImageView.beginProcess( UndoFlag_NoSwapFile );
      applyConvolution(this.flatMaskImageView);
      this.flatMaskImageView.endProcess();

      this.syntheticFlatImageWindowClone = new ImageWindow(
         this.syntheticFlatImage.width,
         this.syntheticFlatImage.height,
         this.syntheticFlatImage.numberOfChannels,
         32,
         true,
         this.syntheticFlatImage.colorSpace != ColorSpace_Gray,
         uniqueViewIdNoLeadingZero("clone")
         );
      this.syntheticFlatImageWindowCloneView = this.syntheticFlatImageWindowClone.mainView;

      // loop thru lightframes
      var succeeded = 0;
      var errored = 0;

      for ( var i = 0; i < this.inputFiles.length; ++i ) {
        try {

          frameImageWindow = fileutils.readImage(this.inputFiles[i])
          var frameImageView = frameImageWindow.mainView;
          if (this.showImages) {
            frameImageWindow.show();
            STFAutoStretch(frameImageView);
          }

          // apply linearisation to bulk image
          this.syntheticFlatImageWindowCloneView.beginProcess( UndoFlag_NoSwapFile );
          this.syntheticFlatImageWindowCloneView.image.assign( this.syntheticFlatImage );
          applyLinearFit(frameImageView,this.syntheticFlatImageWindowCloneView);
          this.syntheticFlatImageWindowCloneView.endProcess();

          // mask lightframe and apply a flat division
          console.noteln("Apply flat division to lightframe: "+frameImageView.id);
          frameImageWindow.maskVisible = false;
          frameImageWindow.mask = this.flatMaskImageWindow;
          frameImageWindow.maskEnabled = true;
          frameImageView.beginProcess( UndoFlag_NoSwapFile );
          applyFlatDivision(frameImageView,this.syntheticFlatImageWindowCloneView);
          frameImageView.endProcess();

          // Save lightframe
          fileutils.writeImage(frameImageWindow,this.inputFiles[i])

          // Close lightframe
          frameImageWindow.maskEnabled = false;
          frameImageWindow.purge();
          frameImageWindow.close();
          frameImageWindow = null;

          // Revert the bulk image linearisation
          this.syntheticFlatImageWindowCloneView.historyIndex = this.syntheticFlatImageWindowCloneView.historyIndex - 1;
          gc();
          ++succeeded;
        }
        catch ( error )
        {
          ++errored;
          if (frameImageWindow != null) {
            frameImageWindow.maskEnabled = false;
            frameImageWindow.purge();
            frameImageWindow.close();
            frameImageWindow = null;
          }
          if ( i+1 == this.inputFiles.length )
            throw error;
            var errorMessage = "<p>" + error.message + ":</p>" +
                               "<p>" + this.inputFiles[i] + "</p>" +
                               "<p><b>Continue batch snthetic flat image diviser ?</b></p>";
           if ( (new MessageBox( errorMessage, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute() != StdButton_Yes )
            break;
         }
      }
      // end loop
      console.writeln( format( "<end><cbr><br>===== %d succeeded, %u error%s, %u skipped =====",
                       succeeded, errored, (errored == 1) ? "" : "s", this.inputFiles.length-succeeded-errored ) );

      this.syntheticFlatImageWindowClone.show();
      // this.flatMaskImageWindow.show();
   }
   catch ( error ) {
     (new MessageBox( error.message, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
   }
   finally {
     if (frameImageWindow != null) {
            frameImageWindow.maskEnabled = false;
            frameImageWindow.purge();
            frameImageWindow.close();
            frameImageWindow = null;
     }

     if(this.syntheticFlatImageWindowClone != null) {
       this.syntheticFlatImageWindowClone.maskEnabled = false;
       this.syntheticFlatImageWindowClone.purge();
       this.syntheticFlatImageWindowClone.close();
       this.syntheticFlatImageWindowClone = null
     }

     this.freeRbiMask();
     this.freeFlatImage();

   }
   // end function
   };

}

var flatDiviser = new FlatImageDiviserEngine;

// Our dialog inherits all properties and methods from the core Dialog object.
BatchFlatDiviserDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   console.hide();

   // Show our dialog box, quit if cancelled.
   var dialog = new BatchFlatDiviserDialog();
   for ( ;; )
   {
      if ( dialog.execute() )
      {
         if ( flatDiviser.inputFiles.length == 0 )
         {
            (new MessageBox( "No input files have been specified!", TITLE, StdIcon_Error, StdButton_Ok )).execute();
            continue;
         }

#ifneq WARN_ON_NO_OUTPUT_DIRECTORY 0
         if ( flatDiviser.outputDirectory.length == 0 )
            if ( (new MessageBox( "<p>No output directory has been specified.</p>" +
                                  "<p>Each image will be written to the directory of " +
                                  "its corresponding input file.<br>" +
                                  "<b>Are you sure?</b></p>",
                                  TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No )).execute() != StdButton_Yes )
               continue;
#endif
         // Perform batch file format conversion and quit.
         console.show();
         console.abortEnabled = true;
         flatDiviser.processingFlatDivision();

         if ( (new MessageBox( "Do you want to perform another synthetic flat division ?",
                               TITLE, StdIcon_Question, StdButton_Yes, StdButton_No )).execute() == StdButton_Yes )
            continue;
      }

      break;
   }
}

main();

// ----------------------------------------------------------------------------
// EOF BatchFlatDiviser.js - Released 2023/09/09 16:24:26 UTC
